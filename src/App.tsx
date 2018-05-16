import { AppBar, Button, Card, CardContent, CardHeader, Grid, IconButton, MuiThemeProvider, Paper, TextField, Toolbar, Tooltip, Typography, Zoom, createMuiTheme, Slide, CardActions, Collapse } from 'material-ui';
import * as React from 'react';
import { RefObject } from 'react';
import * as NotifcationSystem from 'react-notification-system';
import { WorkerInputData, WorkerReturnData } from './SimulationWorker';
import './style.css';

// Register the worker with the worker-loader (no replacement for this require-import found)
// tslint:disable-next-line:no-require-imports
import Worker = require('worker-loader!./SimulationWorker');

export type ResultType = { positions: number[], customers: number[] };

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#1976D2'
        },
        secondary: {
            main: '#E53935'
        }
    }
});

interface State {
    results: ResultType[];
    resultJsxs: JSX.Element[];
    isSimulating: boolean;
    lengthStr: string;
    countStr: string;
    length: number;
    count: number;
    showInfo: boolean;
    showAdditionalInfo: boolean;
}

// TODO: Erläuterungen einbauen.
// TODO: JSDoc-Kommentare
export default class App extends React.Component<object, State> {
    private readonly DEF_LENGTH = 11;
    private readonly DEF_COUNT = 3;
    private readonly CRIT_SIZE_LENGTH = 15;
    private readonly CRIT_SIZE_COUNT = 6;

    private simulationWorker: Worker | null = null;
    private notifcationSystem: RefObject<NotifcationSystem.System>;

    private inLengthChangeTimer: NodeJS.Timer | null = null;
    private inCountChangeTimer: NodeJS.Timer | null = null;

    private notiInLengthError: NotifcationSystem.Notification | null = null;
    private notiInCountError: NotifcationSystem.Notification | null = null;
    private notiErrorInputInvalid: NotifcationSystem.Notification | null = null;
    private notiWarningLengthTooHigh: NotifcationSystem.Notification | null = null;
    private notiWarningCountTooHigh: NotifcationSystem.Notification | null = null;

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
            showInfo: false,
            showAdditionalInfo: false
        };

        this.notifcationSystem = React.createRef();

        this.simulate = this.simulate.bind(this);
        this.onInLengthChanged = this.onInLengthChanged.bind(this);
        this.onInCountChanged = this.onInCountChanged.bind(this);
        this.onSimulationStart = this.onSimulationStart.bind(this);
        this.onSimulationAbort = this.onSimulationAbort.bind(this);
        this.onSimulationReset = this.onSimulationReset.bind(this);
        this.changeInfoVisibility = this.changeInfoVisibility.bind(this);
        this.changeAdditionalInfoVisibility = this.changeAdditionalInfoVisibility.bind(this);
    }

    render() {
        let btnSimulateDisabled: boolean = this.state.isSimulating || this.state.length <= 0 || this.state.count <= 0 || this.state.length < this.state.count;
        let btnAbortDisabled: boolean = !this.state.isSimulating;
        let btnResetDisabled: boolean = this.state.isSimulating;

        return (
            <MuiThemeProvider theme={theme} >
                <div className='App'>
                    <AppBar position='static' className='header' style={{ backgroundColor: '#222' }} >
                        <Toolbar style={{ height: '100%' }}>
                            <div style={{ flex: 1 }}>
                                <Typography
                                    variant='display1'
                                    style={{
                                        color: '#fff',
                                        marginBottom: '5px',
                                        fontSize: '1.8em'
                                    }}
                                >
                                    Spieltheorie - Strandproblem (v1.6)
                                </Typography>
                                {/* <Typography variant='subheading' className='App-github'>
                                    <a href='https://github.com/Dudrie/spieltheorie-strandproblem'><i className='fab fa-github'></i> GitHub</a>
                                </Typography> */}
                            </div>
                            <Button
                                variant='raised'
                                color='primary'
                                href='https://github.com/Dudrie/spieltheorie-strandproblem'
                                target='blank'
                                style={{
                                    height: '40px',
                                    color: '#fff',
                                    textTransform: 'none',
                                    marginRight: theme.spacing.unit + 'px',
                                    backgroundColor: '#6e5494'
                                }}
                            >
                                GitHub <i style={{ marginLeft: theme.spacing.unit }} className='fab fa-github' ></i>
                            </Button>
                            <Tooltip
                                title={
                                    <Typography variant='subheading' style={{ color: '#fff' }} >Mehr Informationen hier</Typography>
                                }
                            >
                                <Button
                                    variant='raised'
                                    color='primary'
                                    style={{
                                        height: '40px',
                                        color: '#fff',
                                        textTransform: 'none',
                                        backgroundColor: this.state.showInfo ? '#EF6C00' : ''
                                    }}
                                    onClick={this.changeInfoVisibility}
                                >
                                    Info <i style={{ marginLeft: theme.spacing.unit }} className='fas fa-info' ></i>
                                </Button>
                            </Tooltip>
                        </Toolbar>
                    </AppBar>

                    <Grid container alignItems='flex-end' justify='center' style={{ width: '100%' }} spacing={8}>
                        <Grid item>
                            <TextField
                                label='Strandlänge'
                                type='number'
                                disabled={this.state.isSimulating}
                                value={this.state.lengthStr}
                                onChange={this.onInLengthChanged}

                            />
                        </Grid>
                        <Grid item>
                            <TextField
                                label='Anzahl Kiosks'
                                type='number'
                                disabled={this.state.isSimulating}
                                value={this.state.countStr}
                                onChange={this.onInCountChanged}
                            />
                        </Grid>
                        <Grid item>
                            <Button
                                disabled={btnSimulateDisabled}
                                variant='raised'
                                size='small'
                                color='primary'
                                onClick={this.onSimulationStart}
                                style={{ textTransform: 'none', fontSize: '1em' }}
                            >
                                Simulation starten
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                disabled={btnAbortDisabled}
                                variant='raised'
                                size='small'
                                color='secondary'
                                onClick={this.onSimulationAbort}
                                style={{ textTransform: 'none', fontSize: '1em' }}
                            >
                                Abbrechen
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                disabled={btnResetDisabled}
                                variant='raised'
                                size='small'
                                onClick={this.onSimulationReset}
                                style={{ textTransform: 'none', fontSize: '1em' }}
                            >
                                Zurücksetzen
                          </Button>
                        </Grid>
                    </Grid>

                    <Slide in={this.state.showInfo} direction='down' unmountOnExit >
                        <Card style={{
                            position: 'absolute',
                            right: '24px', // Padding of the AppBar
                            top: '80px',
                            width: '42vw',
                            // maxWidth: '35vw',
                            zIndex: 1101 // Just above the AppBar :P
                        }}
                        >
                            <CardHeader
                                title='Erläuterungen'
                                subheader='Strandproblem'
                                action={
                                    <IconButton onClick={this.changeInfoVisibility}>
                                        <i className='far fa-times'></i>
                                    </IconButton>
                                }
                            />
                            <CardContent
                                style={{ textAlign: 'justify' }}
                            >
                                Kurze Beschreibung.
                            </CardContent>
                            <CardActions style={{ justifyContent: 'flex-end' }} >
                                <IconButton
                                    key={'addInfo' + this.state.showAdditionalInfo} // Force a rerender.
                                    onClick={this.changeAdditionalInfoVisibility}
                                >
                                    <i
                                        className={'far fa-angle-' + (this.state.showAdditionalInfo ? 'up' : 'down')}
                                    />
                                </IconButton>
                            </CardActions>
                            <Collapse in={this.state.showAdditionalInfo} timeout='auto' unmountOnExit>
                                <CardContent style={{ overflowY: 'auto', maxHeight: '60vh' }} >
                                    Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
                                    Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
                                    Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
                                    Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
                                </CardContent>
                            </Collapse>
                        </Card>
                    </Slide>

                    <Zoom in={this.state.isSimulating || this.state.resultJsxs.length > 0} unmountOnExit >
                        <Paper square elevation={3} className='App-results'>
                            {this.state.isSimulating &&
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    textAlign: 'center',
                                    alignItems: 'center'
                                }}>
                                    <i className='fal fa-cog fa-spin'></i>Simuliere...
                                </div>
                            }

                            {(!this.state.isSimulating && this.state.resultJsxs.length > 0) && <div>
                                <Typography variant='title' >Ergebnis</Typography>
                                <div>
                                    {this.state.resultJsxs}
                                </div>
                            </div>}
                        </Paper>
                    </Zoom>

                    <footer>
                        <Typography className='footer-left' variant='subheading' style={{ color: '#fff' }} >
                            Universität Stuttgart - "Spieltheorie und ökonomisches Verhalten" (Hr. Prof. Dr. Eisermann)
                        </Typography>
                        <Typography className='footer-right' variant='subheading' style={{ color: '#fff' }}>
                            <i className='far fa-copyright'></i> Sascha Skowronnek
                        </Typography>
                    </footer>

                    <NotifcationSystem ref={this.notifcationSystem} />
                </div>
            </MuiThemeProvider>
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
                    this.notiInLengthError = this.showNotification(
                        'Fehler - Länge ungültig',
                        'Der Länge des Strands muss eine positive, natürliche Zahl sein. Aktueller Wert: ' + val + '.',
                        'error',
                        this.notiInLengthError,
                        0
                    );

                    if (this.notiErrorInputInvalid) {
                        this.notifcationSystem.current.removeNotification(this.notiErrorInputInvalid);
                        this.notiErrorInputInvalid = null;
                    }
                }

                return;
            }

            if (this.notifcationSystem.current && this.notiInLengthError) {
                this.notifcationSystem.current.removeNotification(this.notiInLengthError);
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
                    this.notiInCountError = this.showNotification(
                        'Fehler - Anzahl ungültig',
                        'Die Anzahl der Kiosks muss eine positive, natürliche Zahl sein. Aktueller Wert: ' + val + '.',
                        'error',
                        this.notiInCountError,
                        0
                    );

                    if (this.notiErrorInputInvalid) {
                        this.notifcationSystem.current.removeNotification(this.notiErrorInputInvalid);
                        this.notiErrorInputInvalid = null;
                    }
                }

                return;
            }

            if (this.notifcationSystem.current && this.notiInCountError) {
                this.notifcationSystem.current.removeNotification(this.notiInCountError);
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

            this.notiErrorInputInvalid = this.showNotification('Fehler - Eingabe ungültig', msg, 'error', this.notiErrorInputInvalid, 0);
            return false;
        }

        if (this.notifcationSystem.current) {
            if (this.notiErrorInputInvalid) {
                this.notifcationSystem.current.removeNotification(this.notiErrorInputInvalid);
                this.notiErrorInputInvalid = null;
            }

            if (length > this.CRIT_SIZE_LENGTH) {
                if (!this.notiWarningLengthTooHigh) {
                    this.notiWarningLengthTooHigh = this.showNotification(
                        'Warnung - Eingabe zu hoch',
                        'Die Länge des Strands ist länger als ' + this.CRIT_SIZE_LENGTH + '. Dies kann zu einer längeren Berechnungsdauer führen.',
                        'info',
                        this.notiWarningLengthTooHigh,
                        0
                    );
                }
            } else {
                if (this.notiWarningLengthTooHigh) {
                    this.notifcationSystem.current.removeNotification(this.notiWarningLengthTooHigh);
                    this.notiWarningLengthTooHigh = null;
                }
            }

            if (count > this.CRIT_SIZE_COUNT) {
                if (!this.notiWarningCountTooHigh) {
                    this.notiWarningCountTooHigh = this.showNotification(
                        'Warnung - Eingaben zu hoch',
                        'Die Anzahl der Kiosks ist größer als ' + this.CRIT_SIZE_COUNT + '. Dies kann zu einer längeren Berechnungsdauer führen.',
                        'info',
                        this.notiWarningCountTooHigh,
                        0
                    );
                }
            } else {
                if (this.notiWarningCountTooHigh) {
                    this.notifcationSystem.current.removeNotification(this.notiWarningCountTooHigh);
                    this.notiWarningCountTooHigh = null;
                }
            }
        }

        return true;
    }

    private changeInfoVisibility() {
        this.setState({
            showInfo: !this.state.showInfo,
            showAdditionalInfo: this.state.showInfo ? false : this.state.showAdditionalInfo
        });
    }

    private changeAdditionalInfoVisibility() {
        this.setState({ showAdditionalInfo: !this.state.showAdditionalInfo });
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

        this.isValidInput(this.DEF_LENGTH, this.DEF_COUNT);
    }

    private onSimulationAbort() {
        this.abortSimulation(true);
    }

    private simulate() {
        console.log('[APP] starting simulation');
        this.setState({ isSimulating: true });

        this.simulationWorker = new Worker();
        this.simulationWorker.onerror = (ev) => {
            console.error('[ERROR-WORKER] -- ' + ev.message);

            this.showNotification(
                'Simulationsfehler',
                'Während der Simulation ist ein Fehler aufgetreten. Sie wurde abgebrochen. Mehr Informationen sind in der Konsole zu finden.',
                'error',
                null
            );
            this.abortSimulation(false);
        };

        this.simulationWorker.onmessage = (msg) => {
            console.log('[APP] got data');
            let data = msg.data as WorkerReturnData;

            this.setState({
                results: data.results,
                resultJsxs: this.generateJsxElements(data.results),
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

    private abortSimulation(showNotification: boolean) {
        if (!this.state.isSimulating) {
            // Nothing to abort here
            return;
        }

        if (!this.simulationWorker) {
            // No worker which could be aborted
            return;
        }

        console.log('[APP] aborting simulation');
        this.simulationWorker.terminate();
        this.simulationWorker = null;

        this.setState({
            results: [],
            resultJsxs: [],
            isSimulating: false
        });
        console.log('[APP] simulation aborted');

        if (showNotification) {
            this.showNotification('Simulation abgerochen', 'Die Simulation wurde erfolgreich abgebrochen', 'success', null);
        }
    }

    private generateJsxElements(results: ResultType[]): JSX.Element[] {
        let resultEls: JSX.Element[] = [];
        let usedResults: ResultType[] = results.slice(0);

        console.log('[APP] generating jsx elements');

        usedResults.forEach((result, idx) => {
            let positions = result.positions;
            let row: JSX.Element[] = [];

            for (let i = 0; i < this.state.length; i++) {
                let idxSpot: number = positions.indexOf(i);
                let addClassName: string = 'empty';
                let nr = (idxSpot + 1) + '';

                if (idxSpot !== -1) {
                    addClassName = '';
                }

                row.push
                    (<span key={'result-spot-' + i + '-' + idx} className={'fa-layers result-spot ' + addClassName} >
                        <i className='fal fa-home fa-2x'></i>
                        <span className='fa-layers-text' data-fa-transform='shrink-2 up-4' style={{ fontWeight: 500 }} >{nr}</span>
                    </span>
                    );
            }

            let customerJsx: JSX.Element[] = [];

            result.customers.forEach((cust, i) => {
                let addClassName: string = '';
                customerJsx.push(
                    <span key={'cust-' + idx + '-' + i} className={'result-customer-count' + addClassName} >
                        {'K' + (i + 1) + ': ' + cust}
                    </span>
                );
            });

            row.push(
                <Typography
                    key={'result-customers-' + idx}
                    variant='subheading'
                    className='result-customer-count-div'
                    style={{ color: '#000' }}
                >
                    {customerJsx}
                </Typography>
            );

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
            autoDismiss,
            position: 'tl'
        });
    }
}