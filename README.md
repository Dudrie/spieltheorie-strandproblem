# Spieltheorie - Strandproblem
Repository zum Webinterface, welches das Strandproblem simulieren kann. Dieses Webinterface entstand zur Vorlesung "Spieltheorie und ökonomische Prozesse" von Prof. Dr. Eisermann der [Universität Stuttgart](https://www.uni-stuttgart.de/). Das Webinterface ist allerdings noch Work-In-Progress.

# Live-Version
Link zur [Live-Version](https://dudrie.github.io/spieltheorie-strandproblem/). Große Eingabezahlen können allerdings etwas dauern, bis sie berechnet wurden.

# Versionen
## v1.4
- Es werden nun Kioskssymbole mit Nummern im Ergebnis angezeigt anstatt nur Nummern
## v1.3
- Berechnung mit Hilfe eines Entscheidungsbaums
- Nur noch das beste Ergebnis wird ausgegeben
## v1.2
- Verbesserungen
## v1.1
- Filterfunktion
- Verbesserungen
## v1.0
- Initial Release

# Technik
Für die eingegebenen Daten wird das bestmögliche Ergebnis für alle Parteien berechnet. Dafür wird ein Entscheidungsbaum berechnet, der mit dem maxn-Algorithmus von Luckhardt und Irani erstellt wird (Quelle: [Multi-player alpha-beta pruning von Richard E. Korf](https://pdfs.semanticscholar.org/ec08/284de3ac57f72e3aa931881808c322be5edc.pdf)).
.
# Geplante Features
- [x] Simulation abbrechbar machen
- [x] Simulation auf Basis eines Entscheidungsbaum o.ä.
- [ ] Verbesserung des Algorithmus mithilfe von alpha-beta-pruning (s. oben)

# Contribute
Das Webinterface basiert auf dem JS-Framework für UIs "React" (by Facebook) und ist fast vollständig in [Typescript](http://www.typescriptlang.org/) geschrieben. Der verwendete und hier erklärte Package-Manager ist [yarn](https://yarnpkg.com/lang/en/) - es kann aber genauso [npm](https://www.npmjs.com/) genutzt werden.

Um selbst etwas daran zu ändern, kann das Repo geclont werden. Danach muss der Befehl
```
yarn install
```
ausgeführt werden, sodass die benötigten Packages installiert werden. 
