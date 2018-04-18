import * as React from 'react';
import * as NotifcationSystem from 'react-notification-system';

import { RefObject } from 'react';

// Register the worker with the worker-loader (no replacement for this require-import found)
// tslint:disable-next-line:no-require-imports
import Worker = require('worker-loader!./SimulationWorker');

import './style.css';
import { WorkerReturnData, WorkerInputData } from './SimulationWorker';

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

export type FilterIdType = number | 'all' | 'noFilter';
export type ResultType = { positions: number[], customers: number[] };

// TODO: Speicherverbrauch im State optimieren
//          -> Kann man die Results besser speichern?
//          -> Oder die JSX Elemente?
// TODO: Filter vervollständigen
// TODO: Link zum GitHub Code einbauen
// TODO: Simulation in Worker verschieben!
//          -> Dann kann die Simulation auch abgebrochen werden
export default class App extends React.Component<object, State> {
    private readonly DEF_LENGTH = 11;
    private readonly DEF_COUNT = 3;
    private readonly CRIT_SIZE_LENGTH = 15;
    private readonly CRIT_SIZE_COUNT = 6;

    private simulationWorker: Worker | null = null;

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

        this.simulate = this.simulate.bind(this);
        this.onInLengthChanged = this.onInLengthChanged.bind(this);
        this.onInCountChanged = this.onInCountChanged.bind(this);
        this.onSortByKioskClicked = this.onSortByKioskClicked.bind(this);
        this.onSortResetClicked = this.onSortResetClicked.bind(this);
    }

    render() {
        let btnSimulateDisabled: boolean = this.state.isSimulating || this.state.length <= 0 || this.state.count <= 0 || this.state.length < this.state.count;
        // let btnAbortDisabled: boolean = !this.state.isSimulating;

        return (
            <div className='App'>
                <header className='App-header'>
                    <h1 className='App-title'>Spieltheorie - Strandproblem (v1.3)</h1>
                    <div className='App-github'><a href='https://github.com/Dudrie/spieltheorie-strandproblem'><i className='fab fa-github'></i> GitHub</a></div>
                </header>

                <div className='App-inputs'>
                    <label>
                        Strandlänge: <input ref={this.inLength} disabled={this.state.isSimulating} type='text' value={this.state.lengthStr} onChange={this.onInLengthChanged} />
                    </label>
                    <label>
                        Anzahl Kiosks: <input ref={this.inCount} type='text' value={this.state.countStr} onChange={this.onInCountChanged} disabled={this.state.isSimulating} />
                    </label>
                    <button disabled={btnSimulateDisabled} onClick={this.onSimulationStart.bind(this)}>Simulation starten</button>
                    {/* <button disabled={btnAbortDisabled}>Abbrechen</button> */}
                    <button onClick={this.onSimulationReset.bind(this)}>Zurücksetzen</button>
                </div>

                {this.state.isSimulating && <div className='App-results'>
                    <i className='fal fa-cog fa-spin'></i>Simuliere...
                </div>}

                {(!this.state.isSimulating && this.state.resultJsxs.length > 0) && <div className='App-results'>
                    <h3>Ergebnisse (Anzahl: {this.state.results.length})</h3>
                    {/* <div className='div-filter' >
                        <span>Sortieren:</span>
                        <label>
                            <input ref={this.inSortNr} type='text' placeholder='Kiosk Nr.' className='filter-input' />
                        </label>
                        <button onClick={this.onSortByKioskClicked} >Sortiere</button>
                        <span>|</span>
                        <button disabled>Alle</button>
                        <span>|</span>
                        <button onClick={this.onSortResetClicked} >Zurücksetzen</button>
                    </div> */}
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
        }, 150);
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
        }, 150);
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

            if (length > this.CRIT_SIZE_LENGTH && length !== this.state.length) {
                this.showNotification(
                    'Warnung - Eingabe zu hoch',
                    'Die Länge des Strands ist länger als ' + this.CRIT_SIZE_LENGTH + '. Dies kann zu einer längeren Berechnungsdauer führen.',
                    'info',
                    null,
                    8
                );
            }

            if (count > this.CRIT_SIZE_COUNT && count !== this.state.count) {
                this.showNotification(
                    'Warnung - Eingaben zu hoch',
                    'Die Anzahl der Kiosks ist größer als ' + this.CRIT_SIZE_COUNT + '. Dies kann zu einer längeren Berechnungsdauer führen.',
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

        this.setState({
            results: [],
            resultJsxs: [],
            isSimulating: true
        });

        setTimeout(this.simulate, 20);
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
        console.log('[APP] starting simulation');
        this.setState({ isSimulating: true });

        this.simulationWorker = new Worker();
        this.simulationWorker.addEventListener('error', (ev) => console.error('[ERROR-WORKER] -- ' + ev.message));

        this.simulationWorker.onmessage = (msg) => {
            console.log('[APP] got data');
            let data = msg.data as WorkerReturnData;

            this.setState({
                results: data.results,
                resultJsxs: this.generateJsxElements(data.results, this.state.filterId),
                isSimulating: false
            });

            if (this.simulationWorker) {
                this.simulationWorker.terminate();
                this.simulationWorker = null;
            }
        };

        let workerInput: WorkerInputData = { length: this.state.length, count: this.state.count };
        this.simulationWorker.postMessage(workerInput);
    }

    private generateJsxElements(results: ResultType[], filterId: FilterIdType): JSX.Element[] {
        // TODO: Kann man das hier auch in den Worker verschieben?
        //          -> Einfach so geht leider nicht.
        let resultEls: JSX.Element[] = [];
        let usedResults: ResultType[] = results.slice(0);

        console.log('[APP] generating jsx elements');
        console.log('[APP] filtering started');

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
        console.log('[APP] filtering finished');

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

        console.log('[APP] jsx generation finished');
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