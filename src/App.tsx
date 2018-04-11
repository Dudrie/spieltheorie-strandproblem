import * as React from 'react';
import * as NotifcationSystem from 'react-notification-system';

import { RefObject } from 'react';

import './style.css';

interface State {
    results: number[][];
    lengthStr: string;
    countStr: string;
    length: number;
    count: number;
}

export default class App extends React.Component<object, State> {
    private readonly DEF_LENGTH = 11;
    private readonly DEF_COUNT = 3;

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
        let btnDisabled: boolean = this.state.length <= 0 || this.state.count <= 0;

        let resultEls: JSX.Element[] = [];

        this.state.results.forEach((result, idx) => {
            resultEls.push(<div key={'result-' + idx} className='result'>{result}</div>);
        });

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

                {resultEls.length > 0 && <div className='App-results'>
                    <h3>Ergebnisse (Anzahl: {this.state.results.length})</h3>
                    <div>
                        {resultEls}
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

            if (length > 50 || count > 50) {
                this.showNotification(
                    'Warnung - Eingaben zu hoch',
                    'Mindestens eine Eingabe ist größer als 50. Dies kann zu einer langen Berechnungsdauer führen.',
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

        console.log('starting simulation');

        let pastPos: number[][] = [];
        let results: number[][] = [];
        let kioskCount: number = 3;

        // TODO: Mit 3 ausprobieren
        for (let k = 0; k < kioskCount; k++) {
            pastPos[k] = [];
        }

        let done: boolean = false;
        while (!done) {
            let beach: number[] = [];
            for (let i = 0; i < this.state.length; i++) {
                beach[i] = 0;
            }

            for (let k = 0; k < kioskCount; k++) {
                // Find the first free spot
                for (let i = 0; i < this.state.length; i++) {

                    // Check if the position is free and this kiosk there never before
                    if (beach[i] === 0 && pastPos[k].indexOf(i) === -1) {
                        beach[i] = (k + 1);
                        pastPos[k].push(i);
                        break;
                    }
                }
            }

            results.push(beach);

            done = true;
            for (let k = 0; k < kioskCount; k++) {
                if (pastPos[k].length !== this.state.length) {
                    done = false;
                    break;
                }
            }
        }

        console.log('simulation finished');

        this.setState({
            results
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