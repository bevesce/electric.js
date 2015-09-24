# Electric.js

- `./src/` zawiera kod źródłowy biblioteki
- `./build/src/` zawiera bibliotekę skompilowaną do JavaScript + CommonJs (więc żeby użyci bibliotekę na stronie potrzebne jest coś w rodzaju *browserify* lub *webpack*)
- `./examples/` zawiera kod źródłowy przykładów
- `./build/examples/` zawiera skompilowane przykłady, gotowe do uruchomienia

Jeśli ktoś woli *require.js* lub podobne można skompilować bibliotekę do AMD używając kompulatora TypeScript.

Do uruchomienia testów można wykorzystać *gulp*: `gulp test`.