import * as React from 'react';
import * as NotifcationSystem from 'react-notification-system';

import { RefObject } from 'react';

import './style.css';

interface State {
    results: number[][];
    resultJsxs: JSX.Element[];
    lengthStr: string;
    countStr: string;
    length: number;
    count: number;
}

// TODO: Ladehinweis anzeigen :)
//          -> Simulation in Worker verschieben?!
// TODO: Auswertung einbauen
export default class App extends React.Component<object, State> {
    private readonly DEF_LENGTH = 11;
    private readonly DEF_COUNT = 3;
    private readonly CRIT_SIZE = 12;

    private notifcationSystem: RefObject<NotifcationSystem.System>;

    private inLength: RefObject<HTMLInputElement>;
    private inCount: RefObject<HTMLInputElement>;

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
            lengthStr: this.DEF_LENGTH + '',
            countStr: this.DEF_COUNT + '',
            length: this.DEF_LENGTH,
            count: this.DEF_COUNT
        };

        this.notifcationSystem = React.createRef();
        this.inLength = React.createRef();
        this.inCount = React.createRef();

        this.onInLengthChanged = this.onInLengthChanged.bind(this);
        this.onInCountChanged = this.onInCountChanged.bind(this);
    }

    render() {
        let btnDisabled: boolean = this.state.length <= 0 || this.state.count <= 0 || this.state.length < this.state.count;

        return (
            <div className='App'>
                <header className='App-header'>
                    <h1 className='App-title'>Spieltheorie - Strandproblem</h1>
                </header>

                <div className='App-inputs'>
                    <label>
                        Strandlänge: <input ref={this.inLength} type='text' value={this.state.lengthStr} onChange={this.onInLengthChanged} />
                    </label>
                    <label>
                        Anzahl Kiosks: <input ref={this.inCount} type='text' value={this.state.countStr} onChange={this.onInCountChanged} />
                    </label>
                    <button disabled={btnDisabled} onClick={this.onSimulationStart.bind(this)}>Starte Simulation</button>
                    <button onClick={this.onSimulationReset.bind(this)}>Zurücksetzen</button>
                </div>

                {this.state.resultJsxs.length > 0 && <div className='App-results'>
                    <h3>Ergebnisse (Anzahl: {this.state.results.length})</h3>
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
                        this.inLengthErrorNoti
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
                        this.inCountErrorNoti
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

            this.errorInputInvalidNoti = this.showNotification('Fehler - Eingabe ungültig', msg, 'error', this.errorInputInvalidNoti);
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

    private addOnePosition(positions: number[], idx: number, maxPos: number) {
        if (idx === 0) {
            positions[0] = positions[0] + 1;
            return;
        }

        positions[idx] = positions[idx] + 1;

        if (positions[idx] > maxPos) {
            // We are hight than the maximal posible position
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

    private onSimulationStart() {
        if (!this.isValidInput(this.state.length, this.state.count)) {
            return;
        }

        console.log('starting simulation');

        let results: number[][] = [];

        let positions: number[] = [];
        let maxPos: number = this.state.length - 1;

        for (let k = 0; k < this.state.count; k++) {
            positions[k] = 0;
        }

        while (positions[0] <= maxPos) {
            this.addOnePosition(positions, positions.length - 1, maxPos);

            let result: number[] = [];
            positions.forEach((pos, idx) => result[idx] = pos);

            // Search for duplicates. If there are any, don't add it
            if (!this.hasDuplicateEntries(result)) {
                results.push(result);
            }
        }

        console.log('simulation finished');

        this.setState({
            results,
            resultJsxs: this.generateJsxElements(results)
        });
    }

    private onSimulationReset() {
        this.setState({
            results: [],
            length: this.DEF_LENGTH,
            lengthStr: this.DEF_LENGTH + '',
            count: this.DEF_COUNT,
            countStr: this.DEF_COUNT + ''
        });
    }

    private generateJsxElements(results: number[][]): JSX.Element[] {
        let resultEls: JSX.Element[] = [];

        results.forEach((result, idx) => {
            let row: JSX.Element[] = [];

            for (let i = 0; i < this.state.length; i++) {
                let idxSpot: number = result.indexOf(i);
                let addClassName: string = 'empty';
                let text: string = '-';

                if (idxSpot !== -1) {
                    text = (idxSpot + 1) + '';
                    addClassName = '';
                }

                row.push(<span key={'result-spot-' + i + '-' + idx} className={'result-spot ' + addClassName} >{text}</span>);
            }

            resultEls.push(<div key={'result-' + idx} className='result'>{row}</div>);
        });

        return resultEls;
    }

    private showNotification(title: string, message: string | JSX.Element, level: 'error' | 'warning' | 'info' | 'success', oldNoti: NotifcationSystem.Notification | null, autoDismiss: number = 0): NotifcationSystem.Notification | null {
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