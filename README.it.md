# Reader Mode AI

Estensione Chrome (Manifest V3) che aggiunge una modalità lettura elegante ispirata a
Safari Reader e traduce il testo degli articoli in loco con l'API DeepL.

**English version: [README.md](README.md)**

| Reader — tema seppia | Reader — tema scuro |
|---|---|
| ![Modalità lettura, seppia](docs/assets/reader-sepia.png) | ![Modalità lettura, scuro](docs/assets/reader-dark.png) |

## Funzionalità

- **Modalità lettura stile Safari**: colonna centrata ~36em, tipografia serif, header con
  titolo, byline e data; temi bianco/seppia/grigio/scuro; font e corpo regolabili e
  persistenti.
- **Traduzione AI**: sostituzione completa del testo nella lingua scelta (EN, IT, ES, FR,
  DE; default italiano) tramite **DeepL API Free** (chiave gratuita propria). Immagini,
  video e grafici restano al loro posto e **non vengono mai inviati** al provider. Il
  markup inline viene preservato.
- **Cache intelligente**: stringhe e articoli tradotti restano in locale — riaprire un
  articolo già tradotto mostra la traduzione istantaneamente, con **zero chiamate API**.
- **Accesso rapido**: `Alt+R` o il pulsante sulla toolbar; badge `R` sulle pagine con
  articolo riconosciuto. UI localizzata (it/en), `prefers-reduced-motion` rispettato.

## Come iniziare

1. `npm install && npm run build`
2. `chrome://extensions` → modalità sviluppatore → "Carica estensione non
   pacchettizzata" → seleziona `dist/`
3. Icona dell'estensione → **Opzioni** → incolla la tua [chiave DeepL gratuita](https://www.deepl.com/pro-api)
4. Apri un articolo e premi `Alt+R`

## Sviluppo

| Comando | Cosa fa |
|---|---|
| `npm run build` | bundle in `dist/` (esbuild) |
| `npm test` | test unitari (Vitest) |
| `npm run test:e2e` | test end-to-end (Playwright, stub DeepL locale, nessuna chiamata reale) |
| `npm run screenshots` | rigenera gli screenshot in `docs/assets/` |
| `npm run zip` | pacchetto `reader-mode-ai-v<version>.zip` per lo store |

## Come funziona

- Estrazione articolo: [Mozilla Readability](https://github.com/mozilla/readability)
  (MPL-2.0, vedi `src/vendor/NOTICE`) con fallback euristico.
- Pipeline di traduzione: i testi vengono raccolti attorno ai nodi media, spezzati in
  chunk, inviati a DeepL con `tag_handling=html` e sostituiti in loco — i nodi media non
  vengono mai toccati.
- Cache: cache stringhe con chiave FNV-1a + memoria articolo→lingua in
  `chrome.storage.local`.
- Una richiesta al service worker per chunk: la terminazione del worker MV3 non può
  interrompere una traduzione.

## Privacy

Niente analytics, niente server propri. Il testo dell'articolo viene inviato a DeepL
**solo** quando l'utente preme "Traduci". Chiave API e cache restano in
`chrome.storage.local`. Vedi [docs/privacy.md](docs/privacy.md).

## Contribuire

Vedi [CONTRIBUTING.md](CONTRIBUTING.md). Issue e PR benvenute.

## Licenza

[MIT](LICENSE). L'estrazione usa `@mozilla/readability` (MPL-2.0).
