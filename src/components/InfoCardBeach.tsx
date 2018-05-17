import { Card, CardContent, CardHeader, IconButton } from 'material-ui';
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
                <CardContent
                    style={{ textAlign: 'justify' }}
                >
                    Gegeben ist ein Strand mit einer bestimmten Länge l, wobei der Strand die Plätze 0 bis (l-1) hat. Außerdem gibt es k Spieler, die alle ihre Kiosks möglichst gewinnbringend platzieren möchten. Die Kunden gehen immer zum <b>nächsten</b> Kiosk (sind zwei gleichweit entfernt, so verteilen sich die Kunden gleichmäßig auf beide). Die Spieler platzieren ihre Kiosks nacheinander (beginnden mit Spieler 1) und versuchen, das Optimum herauszubekommen. Dabei gibt es insgesamt zwei Kriterien (in dieser Reihenfolge):
                    <ol>
                        <li>Die größtmögliche Anzahl an Kunden bedienen</li>
                        <li>Möglichst weit links sein (dort befindet sich eine Zufahrtsstraße)</li>
                    </ol>
                    Das zweite Kriterium wird nur dann zum Auswerten genutzt, wenn zwei Plätze die gleiche Anzahl an Kunden generieren.
                </CardContent>
                {/* <CardActions style={{ justifyContent: 'flex-end' }} >
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
                </Collapse> */}
            </Card>
        );
    }

    private changeAdditionalInfoVisibility() {
        this.setState({ showAdditionalInfo: !this.state.showAdditionalInfo });
    }
}