# Reader Mode AI

Estensione Chrome (Manifest V3) che aggiunge una modalità lettura visivamente ispirata a
Safari Reader e la traduzione del testo tramite DeepL API Free.

Stato: **Fetta 1 del piano** (scaffold e tooling). Il piano completo, con le decisioni già
chiuse, è in [`docs/plans/2026-10-09-reader-mode-ai.md`](docs/plans/2026-10-09-reader-mode-ai.md).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm install` | installa i dev dependencies |
| `npm run build` | bundle in `dist/` (esbuild) |
| `npm test` | test unitari (Vitest) |
| `npm run test:e2e` | test end-to-end (Playwright, da Fetta 3) |

## Caricamento in Chrome

1. `npm run build`
2. `chrome://extensions` → modalità sviluppatore → "Carica estensione non pacchettizzata" →
   scegli la cartella `dist/`

## Struttura

- `src/manifest.json` — manifest MV3, sorgente di verità per entrypoint e permessi
- `src/background/` — service worker
- `src/content/` — content script e UI del reader
- `build.mjs` — build esbuild → `dist/`
- `tests/unit/` — test Vitest
