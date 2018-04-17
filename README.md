# Spieltheorie - Strandproblem
Repository zum Webinterface, welches das Strandproblem simulieren kann. Dieses Webinterface entstand zur Vorlesung "Spieltheorie und ökonomische Prozesse" von Prof. Dr. Eisermann der [Universität Stuttgart](https://www.uni-stuttgart.de/). Das Webinterface ist allerdings noch Work-In-Progress.

# Live-Version
Link zur [Live-Version](https://dudrie.github.io/spieltheorie-strandproblem/). Man beachte, dass aktuell noch eine Art Brutforce-Algorithmus verwendet wird, der **nicht** abgebrochen werden kann. Man sollte also mit den Eingabezahlen vorsichtig sein.

# Versionen
## v1.1
- Filterfunktion
- Verbesserungen
## v1.0
- Initial Release

# Geplante Features
- [ ] Simulation abbrechbar machen
- [ ] Simulation auf Basis eines Entscheidungsbaum o.ä.

# Contribute
Das Webinterface basiert auf dem JS-Framework für UIs "React" (by Facebook) und ist fast vollständig in [Typescript](http://www.typescriptlang.org/) geschrieben. Der verwendete und hier erklärte Package-Manager ist [yarn](https://yarnpkg.com/lang/en/) - es kann aber genauso [npm](https://www.npmjs.com/) genutzt werden.

Um selbst etwas daran zu ändern, kann das Repo geclont werden. Danach muss der Befehl
```
yarn install
```
ausgeführt werden, sodass die benötigten Packages installiert werden. 
