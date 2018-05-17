import { Card, CardContent, CardHeader, IconButton, CardActions, Collapse, Typography } from 'material-ui';
import { CSSProperties } from 'material-ui/styles/withStyles';
import * as React from 'react';

interface Props {
    onCloseClick: (ev: React.MouseEvent<HTMLElement>) => void;
    style?: CSSProperties;
}

interface State {
    showAdditionalInfo: boolean;
}

export class InfoCardBeach extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            showAdditionalInfo: false
        };

        this.changeAdditionalInfoVisibility = this.changeAdditionalInfoVisibility.bind(this);
    }

    render() {
        return (
            <Card style={this.props.style}
            >
                <CardHeader
                    title='Erläuterungen'
                    subheader='Strandproblem'
                    action={
                        <IconButton onClick={this.props.onCloseClick}>
                            <i className='far fa-times'></i>
                        </IconButton>
                    }
                />
                {/* TODO: In ein 'Accordion' umwandeln, sodass es nicht so hoch wird?! */}
                <CardContent
                    style={{ textAlign: 'justify' }}
                >
                    Gegeben ist ein Strand mit einer bestimmten Länge l wobei der Strand die Plätze 0 bis (l - 1) hat. Außerdem gibt es k Spieler, die alle ihre Kiosks möglichst gewinnbringend platzieren möchten. Die Kunden gehen immer zum <i>nächsten</i> Kiosk (sind zwei gleichweit entfernt, so verteilen sich die Kunden gleichmäßig auf beide). Die Spieler platzieren ihre Kiosks nacheinander (beginnend mit Spieler 1) und versuchen, das Optimum zu erreichen. Dabei gibt es insgesamt zwei Kriterien (in dieser Reihenfolge):
                    <ol>
                        <li>Die größtmögliche Anzahl an Kunden bedienen</li>
                        <li>Möglichst weit links sein (dort befindet sich eine Zufahrtsstraße)</li>
                    </ol>
                    Das zweite Kriterium wird nur dann zum Auswerten genutzt, wenn zwei Plätze die gleiche Anzahl an Kunden generieren. Dadurch ergibt sich eine spieltheoretisches Frage: <br />
                    Was sind die <b>Nash-Gleichgewichte</b> in diesem Spiel? Für jede Konfiguration wird ein Nash-Gleichgewicht berechnet und dargestellt. Somit wird die Frage mithilfe eines Computers zumindest teilweise beantwortet.
                </CardContent>
                <CardActions style={{ justifyContent: 'flex-end' }} >
                    <Typography>
                        Technisches
                    </Typography>
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
                    <CardContent style={{ overflowY: 'auto', maxHeight: '30vh', textAlign: 'justify' }} >
                        Da man nicht alle Möglichkeiten ausprobieren kann (das würde schon bei kleinen Zahlen ewig dauern), wird hier der <i>maxn-Algorithmus</i> von Luckhardt und Irani verwendet, der eine Erweiterung zum <i>minimax</i> darstellt. Dieser arbeitet auf einem Entscheidungsbaum, der aber Teilbäume, die keine Verbesserung mehr bringen können, nicht beachtet. Somit werden die benötigten Rechenschritte verringert.<br />
                        Quelle: <a href='https://pdfs.semanticscholar.org/ec08/284de3ac57f72e3aa931881808c322be5edc.pdf' target='blank' >Multi-player alpha-beta pruning by Richard E. Korf.</a>
                    </CardContent>
                </Collapse>
            </Card>
        );
    }

    private changeAdditionalInfoVisibility() {
        this.setState({ showAdditionalInfo: !this.state.showAdditionalInfo });
    }
}