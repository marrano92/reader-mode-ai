# Reader Mode AI

Estensione Chrome (Manifest V3) che aggiunge una modalità lettura visivamente ispirata a
Safari Reader e la traduzione del testo tramite DeepL API Free.

Piano e decisioni: [`docs/plans/2026-10-09-reader-mode-ai.md`](docs/plans/2026-10-09-reader-mode-ai.md).

## Funzionalità

- **Modalità lettura stile Safari**: colonna centrata ~36em, serif, header con titolo,
  byline e data; temi bianco/seppia/grigio/scuro; font e corpo regolabili e persistenti.
- **Traduzione AI**: sostituzione completa del testo nella lingua scelta (EN, IT, ES, FR,
  DE; default italiano) tramite DeepL API Free. Immagini, video e grafici restano al
  loro posto e non vengono mai inviati al provider. Cache delle traduzioni in locale:
  gli articoli già tradotti si riaprono già tradotti, senza chiamate API.
- **Comandi**: `Alt+R` o click sull'icona per attivare/disattivare; badge `R` sulle
  pagine con articolo riconosciuto.

## Comandi sviluppo

| Comando | Cosa fa |
|---|---|
| `npm install` | installa i dev dependencies |
| `npm run build` | bundle in `dist/` (esbuild) |
| `npm test` | test unitari (Vitest) |
| `npm run test:e2e` | test end-to-end (Playwright; `npx playwright install chromium` la prima volta) |
| `npm run zip` | pacchetto `reader-mode-ai-v<version>.zip` per lo store |

## Provare su Chrome

1. `npm run build`
2. `chrome://extensions` → modalità sviluppatore → "Carica estensione non
   pacchettizzata" → scegli la cartella `dist/`
3. Click sull'icona "Opzioni" dell'estensione → inserisci la chiave **DeepL API Free**
   (gratuita su <https://www.deepl.com/pro-api>) → lingua di default
4. Apri un articolo qualsiasi e premi `Alt+R`

## Struttura

- `src/manifest.json` — manifest MV3, sorgente di verità per entrypoint e permessi
- `src/background/` — service worker (traduzione + cache, badge, comandi)
- `src/content/` — estrazione articolo, overlay reader, toolbar
- `src/translate/` — pipeline e chunker (media esclusi dalla traduzione)
- `src/translators/` — adapter DeepL (interfaccia provider-agnostica)
- `src/options/` — pagina impostazioni
- `src/_locales/` — UI it/en
- `tests/unit/`, `tests/e2e/` — Vitest e Playwright (stub DeepL locale)
- `docs/privacy.md`, `docs/operations/release.md` — privacy e runbook di rilascio

## Licenze

L'estrazione usa `@mozilla/readability` (MPL-2.0): vedi `src/vendor/NOTICE`.
