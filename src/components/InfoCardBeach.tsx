import { Card, CardContent, CardHeader, ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, IconButton, Typography } from '@material-ui/core';
import * as React from 'react';
import { CSSProperties } from 'react';

interface Props {
    onCloseClick: (ev: React.MouseEvent<HTMLElement>) => void;
    style?: CSSProperties;
}

interface State {
    openedPanelId: number | boolean;
}

const styles = {
    heading: {
        fontSize: '1em',
        flexBasis: '33.33%',
        flexShrink: 0,
    },
    secondaryHeading: {
        fontSize: '1em',
        color: 'gray',
    }
};

export class InfoCardBeach extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            openedPanelId: 0
        };
    }

    render() {
        return (
            <Card style={this.props.style}
            >
                <CardHeader
                    title='Informationen'
                    subheader='Strandproblem'
                    action={
                        <IconButton onClick={this.props.onCloseClick}>
                            <i className='far fa-times'></i>
                        </IconButton>
                    }
                />
                <CardContent style={{ textAlign: 'justify' }} >
                    <ExpansionPanel
                        expanded={this.state.openedPanelId === 0}
                        onChange={(_, isExp) => this.onExpansionChange(0, isExp)}
                    >
                        <ExpansionPanelSummary expandIcon={<i className='far fa-angle-down' ></i>} >
                            <Typography style={styles.heading} >Problemerläuterung</Typography>
                            <Typography style={styles.secondaryHeading}>Was wird gemacht?</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Typography component='div'>
                                Gegeben ist ein Strand mit einer bestimmten Länge l wobei der Strand die Plätze 0 bis (l - 1) hat. Außerdem gibt es k Spieler, die alle ihre Kiosks möglichst gewinnbringend platzieren möchten. Die Kunden gehen immer zum <i>nächsten</i> Kiosk (sind zwei gleichweit entfernt, so verteilen sich die Kunden gleichmäßig auf beide). Die Spieler platzieren ihre Kiosks nacheinander (beginnend mit Spieler 1) und versuchen, das Optimum zu erreichen. Dabei gibt es insgesamt zwei Kriterien (in dieser Reihenfolge):
                                <ol>
                                    <li>Die größtmögliche Anzahl an Kunden bedienen</li>
                                    <li>Möglichst weit links sein (dort befindet sich eine Zufahrtsstraße)</li>
                                </ol>
                                Das zweite Kriterium wird nur dann zum Auswerten genutzt, wenn zwei Plätze die gleiche Anzahl an Kunden generieren. Dadurch ergibt sich eine spieltheoretisches Frage: <br />
                                Was sind die <b>Nash-Gleichgewichte</b> in diesem Spiel? Für jede Konfiguration wird ein Nash-Gleichgewicht berechnet und dargestellt. Somit wird die Frage mithilfe eines Computers zumindest teilweise beantwortet.
                            </Typography>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>

                    <ExpansionPanel
                        expanded={this.state.openedPanelId === 1}
                        onChange={(_, isExp) => this.onExpansionChange(1, isExp)}
                    >
                        <ExpansionPanelSummary expandIcon={<i className='far fa-angle-down' ></i>} >
                            <Typography style={styles.heading} >Technisches</Typography>
                            <Typography style={styles.secondaryHeading}>Wie wird es gemacht?</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Typography >
                                Da man nicht alle Möglichkeiten ausprobieren kann (das würde schon bei kleinen Zahlen ewig dauern), wird hier der <i>maxn-Algorithmus</i> von Luckhardt und Irani verwendet, der eine Erweiterung zum <i>minimax</i> darstellt. Dieser arbeitet auf einem Entscheidungsbaum, der aber Teilbäume, die keine Verbesserung mehr bringen können, nicht beachtet. Somit werden die benötigten Rechenschritte verringert.<br />
                                Quelle: <a href='https://pdfs.semanticscholar.org/ec08/284de3ac57f72e3aa931881808c322be5edc.pdf' target='blank' >Multi-player alpha-beta pruning by Richard E. Korf.</a>
                            </Typography>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>

                </CardContent>
            </Card>
        );
    }

    private onExpansionChange(id: number, isExpanded: boolean) {
        this.setState({
            openedPanelId: isExpanded ? id : false
        });
    }
}