import { ResultType } from './App';

const worker: Worker = self as any;

export type WorkerInputData = { length: number; count: number; };
export type WorkerReturnData = { results: ResultType[] };

let isSimulating: boolean = false;

worker.addEventListener('message', (ev) => {
    console.log('Worker got data');
    let data: WorkerInputData = ev.data as WorkerInputData;

    if (!isSimulating) {
        isSimulating = true;
        let results = simulate(data.length, data.count);

        let workerReturn: WorkerReturnData = {
            results,
        };
        worker.postMessage(workerReturn);
    }
});

function simulate(length: number, count: number): ResultType[] {
    let results: ResultType[] = [];

    let positions: number[] = [];
    let maxPos: number = length - 1;

    for (let k = 0; k < count; k++) {
        positions[k] = 0;
    }

    if (positions.length === 1) {
        // The algorithem used in addOnePosition(..) misses the first result if positions only contains one element. We'll add this edge case 'manually'.
        results.push({
            positions: [positions[0]],
            customers: []
        });
    }

    let done: boolean = false;
    while (!done) {
        addOnePosition(positions, positions.length - 1, maxPos);
        // console.log('P: ');
        // console.log(positions);

        let result: number[] = [];
        positions.forEach((pos, idx) => result[idx] = pos);

        // Search for duplicates. If there are any, don't add it
        if (!hasDuplicateEntries(result)) {
            results.push({
                positions: result,
                customers: []
            });
        }

        // Check if we're done. The kiosk have to be positioned correctly in the last spots DESCENDING.
        // We're assuming that we're done. If we find one kiosk which does not fit to the above we have to continue.
        done = true;
        for (let i = 0; i < positions.length; i++) {
            if (positions[i] !== maxPos - i) {
                done = false;
                break;
            }
        }
    }

    console.log('positions set');

    // Calculate the amount of customers everybody gets.
    console.log('calculate customers');
    results.forEach((result) => {
        let customers: number[] = [];
        let lastKioskPos: number = -1;

        for (let i = 0; i < length; i++) {
            let idxKiosk: number = result.positions.indexOf(i);
            let idxLastKiosk: number = result.positions.indexOf(lastKioskPos);

            if (idxKiosk !== -1) {
                // We found a kiosk at the given spot. Calculate it's customers
                let spotsBetween: number = i - lastKioskPos - 1; // Do NOT count the both spots with the kiosk

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

            if (i === length - 1) {
                // We're add the end, so add all customors between the end and the last kiosk to the last kiosk
                customers[idxLastKiosk] = customers[idxLastKiosk] + (length - 1 - lastKioskPos);
                // console.log(idxLastKiosk, customers[idxLastKiosk]);
            }
        }

        result.customers = customers;

        // console.log('R ' + result.customers);
    });

    return results;
}

function addOnePosition(positions: number[], idx: number, maxPos: number) {
    if (idx === 0) {
        // Only increase the first position if we're not at the max position.
        if (positions[0] < maxPos) {
            positions[0] = positions[0] + 1;
        }

        return;
    }

    positions[idx] = positions[idx] + 1;

    if (positions[idx] > maxPos) {
        // We are higher than the maximal posible position
        positions[idx] = 0;
        addOnePosition(positions, idx - 1, maxPos);
    }
}

function hasDuplicateEntries(array: number[]): boolean {
    for (let i = 0; i < array.length - 1; i++) {
        if (array.indexOf(array[i], i + 1) !== -1) {
            // Found a duplicate
            return true;
        }
    }

    return false;
}