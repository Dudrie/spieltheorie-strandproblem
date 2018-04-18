import { ResultType } from './App';

const worker: Worker = self as any;

export type WorkerInputData = { length: number; count: number; };
export type WorkerReturnData = { results: ResultType[] };

let isSimulating: boolean = false;
let beachLength: number;
let currentPositions: number[];
let savedPositions: number[];

// FIXME: Die Positionen für die spielerIds k>=1 werden nicht korrekt gespeichert. Sie bleiben beim Standardwert '-1'.
worker.addEventListener('message', (ev) => {
    console.log('[WORKER] got data');
    let data: WorkerInputData = ev.data as WorkerInputData;

    if (!isSimulating) {
        isSimulating = true;
        console.log('[WORKER] starting simulation');
        beachLength = data.length;

        let results = simulate(data.count);

        // console.log('Pos');
        // console.log(savedPositions);
        // console.log('Customers');
        // console.log(results[0].customers);
        
        console.log('[WORKER] simulation done -- sending results');
        let workerReturn: WorkerReturnData = {
            results,
        };
        worker.postMessage(workerReturn);
        isSimulating = false;
    }
});

function simulate(plyCount: number): ResultType[] {
    let results: ResultType[] = [];
    savedPositions = new Array(plyCount).fill(-1);

    // Simulate, considering player with ID 0 starts.
    // let customers: number[] = maxn(plyCount, 0, plyCount, plyCount);
    let customers: number[] = [];

    for (let i = 0; i < plyCount; i++) {
        currentPositions = new Array(plyCount).fill(-1);

        for (let k = 0; k < i; k++) {
            currentPositions[k] = savedPositions[k];

        }

        customers = maxn(plyCount - i, i, plyCount, plyCount - i);
    }

    // After it, savedPositions should be the best positions while customers should be the customers for the kiosks.
    results.push({
        positions: savedPositions,
        customers
    });

    return results;
}

function maxn(depth: number, currentPly: number, plyCount: number, maxDepth: number): number[] {
    if (depth === 0) {
        return calculateCustomers();
    }

    let bestCustomers: number[] = new Array(plyCount).fill(0);
    let bestPos: number = Number.POSITIVE_INFINITY;
    let turns: number[] = getPossibleSpots();

    while (turns.length > 0) {
        let turn: number | undefined = turns.pop();
        // console.log('Turn: ' + turn);
        if (turn === undefined) {
            continue;
        }

        // Do the turn
        let prevPos: number = currentPositions[currentPly];
        currentPositions[currentPly] = turn;

        // Go one level deeper in the tree and get the customers.
        let customers = maxn(depth - 1, currentPly + 1, plyCount, maxDepth);

        // Check if this variant is better than the previous one (for the specific player!)
        if (compareCustomers(customers, bestCustomers, turn, bestPos, currentPly) > 0) {
            // It's better
            bestCustomers = customers;
            if (depth === maxDepth) {
                savedPositions = new Array(plyCount).fill(-1);
                currentPositions.forEach((pos, idx) => savedPositions[idx] = pos);
            }
        }

        // Undo the turn made
        currentPositions[currentPly] = prevPos;
    }

    return bestCustomers;
}

/**
 * Returns the number of customers of every player as an array. Keys are the player IDs.
 * @returns Array with the amount of customers per player
 */
function calculateCustomers(): number[] {
    let customers: number[] = new Array(currentPositions.length).fill(0);
    let lastKioskPos: number = -1;

    for (let i = 0; i < beachLength; i++) {
        let idxKiosk: number = currentPositions.indexOf(i);
        let idxLastKiosk: number = currentPositions.indexOf(lastKioskPos);

        if (idxKiosk !== -1) {
            // We found a kiosk at the given spot. Calculate it's customers
            let spotsBetween: number = i - lastKioskPos - 1; // Do NOT count the both spots with the kiosks

            if (lastKioskPos === -1) {
                // We found the FIRST kiosk, so just add all spots and his own
                customers[idxKiosk] = spotsBetween + 1;

            } else {
                // We found an additional one, so do some calculation magic
                customers[idxKiosk] = (spotsBetween / 2) + 1;
                customers[idxLastKiosk] = customers[idxLastKiosk] + (spotsBetween / 2);

            }

            lastKioskPos = i;
        }

        if (i === beachLength - 1) {
            // We're add the end, so add all customors between the end and the last kiosk to the last kiosk
            customers[idxLastKiosk] = customers[idxLastKiosk] + (beachLength - 1 - lastKioskPos);
            // console.log(idxLastKiosk, customers[idxLastKiosk]);
        }
    }

    return customers;
}

/**
 * Compares the two customer-array in regards of the customer count and (if a tie occurs) on the basis of the positioning.
 * @param c1 Customers now
 * @param c2 Customers before
 * @param pos1 Position now
 * @param pos2 Positien before
 * @param plyId ID of the player
 */
function compareCustomers(c1: number[], c2: number[], pos1: number, pos2: number, plyId: number, ): number {
    if (c1[plyId] > c2[plyId]) {
        return 1;
    }

    if (c1[plyId] < c2[plyId]) {
        return -1;
    }

    // Tie in regards of the customers, so let the position decide, but in descending manner (more on the left = better)
    if (pos1 < pos2) {
        return 1;
    }

    if (pos1 > pos2) {
        return -1;
    }

    // The two customer counts are equall
    return 0;
}

/**
 * Returns an array containing all free spots (so all spots where the player can put it's kiosk).
 * @returns Array containing all free spots.
 */
function getPossibleSpots(): number[] {
    let freeSpots: number[] = [];

    for (let i = 0; i < beachLength; i++) {
        let idx = currentPositions.indexOf(i);

        if (idx === -1) {
            freeSpots.push(i);
        }
    }

    return freeSpots;
}