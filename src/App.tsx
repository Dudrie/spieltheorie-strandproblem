import * as React from 'react';
import * as NotifcationSystem from 'react-notification-system';

import { RefObject } from 'react';

import './style.css';

interface State {
    results: ResultType[];
    resultJsxs: JSX.Element[];
    isSimulating: boolean;
    lengthStr: string;
    countStr: string;
    length: number;
    count: number;
    filterId: FilterIdType;
}

type FilterIdType = number | 'all' | 'noFilter';
type ResultType = { positions: number[], customers: number[] };

// FIXME: Bei 11-1 ist das letzte Ergebnis leer und es fehlt das '1. Ergebnis' (10 000 000 000)
// TODO: Filter vervollständigen
// TODO: Link zum GitHub Code einbauen
// TODO: Ladehinweis anzeigen :)
//          -> Simulation in Worker verschieben?!
export default class App extends React.Component<object, State> {
    private readonly DEF_LENGTH = 11;
    private readonly DEF_COUNT = 3;
    private readonly CRIT_SIZE = 12;

    private notifcationSystem: RefObject<NotifcationSystem.System>;

    private inLength: RefObject<HTMLInputElement>;
    private inCount: RefObject<HTMLInputElement>;
    private inSortNr: RefObject<HTMLInputElement>;

    private inLengthChangeTimer: NodeJS.Timer | null = null;
    private inLengthErrorNoti: NotifcationSystem.Notification | null = null;
    private inCountChangeTimer: NodeJS.Timer | null = null;
    private inCountErrorNoti: NotifcationSystem.Notification | null = null;
    private errorInputInvalidNoti: NotifcationSystem.Notification | null = null;

    constructor(props: object) {
        super(props);

        this.state = {
            results: [],
            resultJsxs: [],
            isSimulating: false,
            lengthStr: this.DEF_LENGTH + '',
            countStr: this.DEF_COUNT + '',
            length: this.DEF_LENGTH,
            count: this.DEF_COUNT,
            filterId: 'noFilter'
        };

        this.notifcationSystem = React.createRef();
        this.inLength = React.createRef();
        this.inCount = React.createRef();
        this.inSortNr = React.createRef();

        this.onInLengthChanged = this.onInLengthChanged.bind(this);
        this.onInCountChanged = this.onInCountChanged.bind(this);
        this.onSortByKioskClicked = this.onSortByKioskClicked.bind(this);
        this.onSortResetClicked = this.onSortResetClicked.bind(this);
    }

    render() {
        let btnSimulateDisabled: boolean = this.state.isSimulating || this.state.length <= 0 || this.state.count <= 0 || this.state.length < this.state.count;

        return (
            <div className='App'>
                <header className='App-header'>
                    <h1 className='App-title'>Spieltheorie - Strandproblem (v1.0)</h1>
                </header>

                <div className='App-inputs'>
                    <label>
                        Strandlänge: <input ref={this.inLength} disabled={this.state.isSimulating} type='text' value={this.state.lengthStr} onChange={this.onInLengthChanged} />
                    </label>
                    <label>
                        Anzahl Kiosks: <input ref={this.inCount} type='text' value={this.state.countStr} onChange={this.onInCountChanged} disabled={this.state.isSimulating} />
                    </label>
                    <button disabled={btnSimulateDisabled} onClick={this.onSimulationStart.bind(this)}>Starte Simulation</button>
                    <button onClick={this.onSimulationReset.bind(this)}>Zurücksetzen</button>
                </div>

                {this.state.resultJsxs.length > 0 && <div className='App-results'>
                    <h3>Ergebnisse (Anzahl: {this.state.results.length})</h3>
                    <div className='div-filter' >
                        <span>Sortieren:</span>
                        <label>
                            <input ref={this.inSortNr} type='text' placeholder='Kiosk Nr.' className='filter-input' />
                        </label>
                        <button onClick={this.onSortByKioskClicked} >Sortiere</button>
                        <span>|</span>
                        <button disabled>Alle</button>
                        <span>|</span>
                        <button onClick={this.onSortResetClicked} >Zurücksetzen</button>
                    </div>
                    <div>
                        {this.state.resultJsxs}
                    </div>
                </div>}

                <NotifcationSystem ref={this.notifcationSystem} />
            </div>
        );
    }

    private onInLengthChanged(ev: React.ChangeEvent<HTMLInputElement>) {
        if (this.inLengthChangeTimer) {
            clearTimeout(this.inLengthChangeTimer);
        }

        let val = ev.target.value;
        this.setState({
            lengthStr: val
        });

        this.inLengthChangeTimer = setTimeout(() => {
            if (this.inLengthChangeTimer) {
                clearTimeout(this.inLengthChangeTimer);
            }

            let length: number = Number.parseInt(val);

            if (Number.isNaN(length) || length <= 0) {
                this.setState({
                    length: -1
                });

                if (this.notifcationSystem.current && val !== '') {
                    this.inLengthErrorNoti = this.showNotification(
                        'Fehler - Länge ungültig',
                        'Der Länge des Strands muss eine positive, natürliche Zahl sein. Aktueller Wert: ' + val + '.',
                        'error',
                        this.inLengthErrorNoti,
                        0
                    );

                    if (this.errorInputInvalidNoti) {
                        this.notifcationSystem.current.removeNotification(this.errorInputInvalidNoti);
                        this.errorInputInvalidNoti = null;
                    }
                }

                return;
            }

            if (this.notifcationSystem.current && this.inLengthErrorNoti) {
                this.notifcationSystem.current.removeNotification(this.inLengthErrorNoti);
            }

            this.isValidInput(length, this.state.count);

            this.setState({
                length
            });
        }, 350);
    }

    private onInCountChanged(ev: React.ChangeEvent<HTMLInputElement>) {
        if (this.inCountChangeTimer) {
            clearTimeout(this.inCountChangeTimer);
        }

        let val = ev.target.value;
        this.setState({
            countStr: val
        });

        this.inCountChangeTimer = setTimeout(() => {
            if (this.inCountChangeTimer) {
                clearTimeout(this.inCountChangeTimer);
            }

            let count: number = Number.parseInt(val);

            if (Number.isNaN(count) || count <= 0) {
                this.setState({
                    count: -1
                });

                if (this.notifcationSystem.current && val !== '') {
                    this.inCountErrorNoti = this.showNotification(
                        'Fehler - Anzahl ungültig',
                        'Die Anzahl der Kiosks muss eine positive, natürliche Zahl sein. Aktueller Wert: ' + val + '.',
                        'error',
                        this.inCountErrorNoti,
                        0
                    );

                    if (this.errorInputInvalidNoti) {
                        this.notifcationSystem.current.removeNotification(this.errorInputInvalidNoti);
                        this.errorInputInvalidNoti = null;
                    }
                }

                return;
            }

            if (this.notifcationSystem.current && this.inCountErrorNoti) {
                this.notifcationSystem.current.removeNotification(this.inCountErrorNoti);
            }

            this.isValidInput(this.state.length, count);

            this.setState({
                count
            });
        }, 350);
    }

    private isValidInput(length: number, count: number): boolean {
        if (length < count) {
            let msg: JSX.Element = <>
                Es gibt zu wenig Strand (oder zu viele Kiosks - Ansichtssache). Der Strand muss mindestens so lang sein wie die Anzahl der Kiosks.<br />
                <br />
                Strand: {length}, Kiosks: {count}
            </>;

            this.errorInputInvalidNoti = this.showNotification('Fehler - Eingabe ungültig', msg, 'error', this.errorInputInvalidNoti, 0);
            return false;
        }

        if (this.notifcationSystem.current) {
            if (this.errorInputInvalidNoti) {
                this.notifcationSystem.current.removeNotification(this.errorInputInvalidNoti);
                this.errorInputInvalidNoti = null;
            }

            if (length >= this.CRIT_SIZE || count >= this.CRIT_SIZE) {
                this.showNotification(
                    'Warnung - Eingaben zu hoch',
                    'Mindestens eine Eingabe ist größer als oder gleich wie' + this.CRIT_SIZE + '. Dies kann zu einer längeren Berechnungsdauer führen.',
                    'info',
                    null,
                    8
                );
            }
        }

        return true;
    }

    private onSimulationStart() {
        if (!this.isValidInput(this.state.length, this.state.count)) {
            return;
        }

        this.simulate();
    }

    private onSimulationReset() {
        this.setState({
            results: [],
            resultJsxs: [],
            isSimulating: false,
            length: this.DEF_LENGTH,
            lengthStr: this.DEF_LENGTH + '',
            count: this.DEF_COUNT,
            countStr: this.DEF_COUNT + ''
        });
    }

    private onSortByKioskClicked() {
        if (!this.inSortNr.current) {
            return;
        }

        let kioskNr: number = Number.parseInt(this.inSortNr.current.value);

        // We'll subtract one from the kioskNr later to map the number to the actual index.
        if (Number.isNaN(kioskNr)) {
            this.showNotification(
                'Fehler - Kiosk Nr. ungültig',
                'Die angegebene Kiosk Nummer (' + this.inSortNr.current.value + ') ist keine Zahl.',
                'error',
                null
            );

            return;
        }

        if (kioskNr > this.state.count || kioskNr <= 0) {
            // TODO: Fehlermeldung anzeigen
            this.showNotification(
                'Fehler - Kiosk Nr. ungültig',
                'Die angegebene Kiosk Nummer (' + kioskNr + ') nicht im erforderlichen Bereich [1, ' + this.state.count + '].',
                'error',
                null
            );
            return;
        }

        let filterId: FilterIdType = kioskNr - 1;

        // Don't sort again if the filter stays the same.
        if (this.state.filterId === filterId) {
            return;
        }

        this.setState({
            filterId,
            resultJsxs: this.generateJsxElements(this.state.results, filterId)
        });
    }

    private onSortResetClicked() {
        this.setState({
            filterId: 'noFilter',
            resultJsxs: this.generateJsxElements(this.state.results, 'noFilter')
        });
    }

    private simulate() {
        console.log('starting simulation');
        this.setState({ isSimulating: true });

        let results: ResultType[] = [];

        let positions: number[] = [];
        let maxPos: number = this.state.length - 1;

        for (let k = 0; k < this.state.count; k++) {
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
            this.addOnePosition(positions, positions.length - 1, maxPos);
            // console.log('P: ');
            // console.log(positions);

            let result: number[] = [];
            positions.forEach((pos, idx) => result[idx] = pos);

            // Search for duplicates. If there are any, don't add it
            if (!this.hasDuplicateEntries(result)) {
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

            for (let i = 0; i < this.state.length; i++) {
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

                if (i === this.state.length - 1) {
                    // We're add the end, so add all customors between the end and the last kiosk to the last kiosk
                    customers[idxLastKiosk] = customers[idxLastKiosk] + (this.state.length - 1 - lastKioskPos);
                    // console.log(idxLastKiosk, customers[idxLastKiosk]);
                }
            }

            result.customers = customers;

            // console.log('R ' + result.customers);
        });

        console.log('simulation finished');

        this.setState({
            results,
            resultJsxs: this.generateJsxElements(results, this.state.filterId),
            isSimulating: false
        });
    }

    private addOnePosition(positions: number[], idx: number, maxPos: number) {
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
            this.addOnePosition(positions, idx - 1, maxPos);
        }
    }

    private hasDuplicateEntries(array: number[]): boolean {
        for (let i = 0; i < array.length - 1; i++) {
            if (array.indexOf(array[i], i + 1) !== -1) {
                // Found a duplicate
                return true;
            }
        }

        return false;
    }

    private generateJsxElements(results: ResultType[], filterId: FilterIdType): JSX.Element[] {
        let resultEls: JSX.Element[] = [];
        let usedResults: ResultType[] = results.slice(0);

        // Check if we want to filter the results first.
        if (filterId !== 'noFilter') {
            if (filterId === 'all') {
                // TODO: Implementiere 'all'-Filter

            } else {
                usedResults.sort((a: ResultType, b: ResultType) => {
                    return b.customers[filterId] - a.customers[filterId];
                });
            }
        }

        usedResults.forEach((result, idx) => {
            let positions = result.positions;
            let row: JSX.Element[] = [];

            for (let i = 0; i < this.state.length; i++) {
                let idxSpot: number = positions.indexOf(i);
                let addClassName: string = 'empty';
                let text: string = '-';

                if (idxSpot !== -1) {
                    text = (idxSpot + 1) + '';
                    addClassName = '';
                }

                row.push(<span key={'result-spot-' + i + '-' + idx} className={'result-spot ' + addClassName} >{text}</span>);
            }

            let customerJsx: JSX.Element[] = [];

            result.customers.forEach((cust, i) => {
                let addClassName: string = '';
                if (i === filterId) {
                    addClassName += ' filtered-by';
                }

                customerJsx.push(
                    <span key={'cust-' + idx + '-' + i} className={'result-customer-count' + addClassName} >
                        {'K' + (i + 1) + ': ' + cust}
                    </span>
                );
            });

            row.push(<div key={'result-customers-' + idx} className='result-customer-count-div' >{customerJsx}</div>);

            resultEls.push(<div key={'result-' + idx} className='result'>{row}</div>);
        });

        return resultEls;
    }

    private showNotification(title: string, message: string | JSX.Element, level: 'error' | 'warning' | 'info' | 'success', oldNoti: NotifcationSystem.Notification | null, autoDismiss: number = 5): NotifcationSystem.Notification | null {
        if (!this.notifcationSystem.current) {
            return null;
        }

        if (oldNoti) {
            this.notifcationSystem.current.removeNotification(oldNoti);
        }

        return this.notifcationSystem.current.addNotification({
            title,
            children: message,
            level,
            dismissible: autoDismiss !== 0,
            autoDismiss
        });
    }
}