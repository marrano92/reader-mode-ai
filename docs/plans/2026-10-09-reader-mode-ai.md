---
title: "Issue + Piano — Estensione Chrome Reader Mode (stile Safari) con traduzione AI"
status: "done"
owner: "marrano92"
last_updated: "2026-10-09"
type: "plan"
tags: ["chrome-extension", "mv3", "reader-mode", "ai-traduzione", "piano"]
---

# Issue

Estensione Chrome (Manifest V3) che:

1. attiva una **modalità lettura** visivamente ispirata a Safari Reader (colonna di testo
   centrata, serif, tipografia ariosa, header con titolo/byline/data, temi di sfondo);
2. può **tradurre il testo dell'articolo** in una lingua scelta, tramite AI, preservando la
   struttura e il markup inline della pagina.

# Contesto

Progetto nuovo (greenfield) in `sperimental/reader-mode-ai/`. Non esistono ancora codice,
test né convenzioni di repo oltre a quelle globali (`AGENTS.md`): documenti in italiano,
codice/identifier in inglese, fette verticali con un commit ciascuna.

Vincoli tecnici noti fin da ora:

- **MV3**: niente background page persistente; il service worker può essere terminato in
  qualsiasi momento → la pipeline di traduzione non deve accumulare stato in memoria lì.
- **Content script in isolated world**: la UI del reader va resa in **Shadow DOM** per non
  subire il CSS della pagina e non iniettarne.
- **Privacy/costi AI**: il testo della pagina viene inviato a un provider terzo → serve
  dichiarazione esplicita in Web Store e nessuna chiave API nei log.
- **Mozilla Readability** (MPL-2.0) è lo standard de facto per l'estrazione articolo: si
  vende come modulo vendored con NOTICE, oppure si scrivono euristiche proprie (decisione
  aperta D7).

# Ambito

- Solo Chrome desktop (MV3) — D5 chiusa.
- Estrazione articolo, overlay reader, impostazioni tipografiche, traduzione AI per blocchi.
- Provider di traduzione: **DeepL API Free** con chiave dell'utente, nessun backend nostro
  (D1, D2 chiuse). Interfaccia adapter provider-agnostica; adapter aggiuntivi (LLM vari,
  Gemini Nano) rimandati fuori dallo scope iniziale.
- Traduzione a **sostituzione completa del testo**, con struttura e media preservati (D3).
- Lingue target a elenco fisso: EN, IT, ES, FR, DE — **default italiano** (D4).

# Fuori ambito

- Sincronizzazione impostazioni tra device, account, backend propri.
- Traduzione di PDF, email webmail, canvas/WebGL, video.
- Vendita/licensing della chiave API da parte nostra (resta all'utente).

# Rischi

| Rischio | Impatto | Mitigazione |
|---|---|---|
| Service worker MV3 ucciso durante traduzioni lunghe | Traduzione interrotta a metà | Una richiesta per blocco (content → SW), nessuno stato accumulato; ripresa dalla cache |
| Estrazione fallisce su SPA/paywall/shadow DOM | Reader vuoto o parziale | Fallback euristico + messaggio "contenuto parziale"; mai rompere la pagina originale |
| CORS/CSP verso l'endpoint AI | Fetch fallite | Fetch dal service worker con `host_permissions` limitate all'endpoint del provider scelto (`optional_host_permissions` + richiesta on-demand) |
| Review Web Store per estensioni che inviano pagine ad AI | Rifiuto/ritardo | Privacy policy pubblica, permessi minimi, trasparenza su cosa viene inviato |
| Licenza MPL-2.0 di Readability | Compatibilità licenza | Scelto il vendoring (D7 chiusa) con NOTICE; modifiche a `readability.js` mantenute open source |
| Costi API per l'utente | UX pessima se inatteso | Cache per contenuto+lingua, stima caratteri prima di tradurre, provider locale (Ollama / Gemini Nano) come opzione |
| Chrome built-in AI (Gemini Nano) solo su hardware compatibile | Feature fantasma | Adapter opzionale con feature-detect, mai unico percorso |

# Decisioni

Chiuse (2026-10-09):

- **D1 — Provider AI**: **DeepL API Free** come unico provider iniziale. L'interfaccia
  `translateBlocks(blocks, targetLang)` resta provider-agnostica; adapter aggiuntivi
  (OpenAI-compatibile, Gemini Nano) fuori scope, reintroducibili come fetta dedicata.
- **D2 — Modello chiavi**: chiave personale dell'utente, nessun backend nostro.
- **D3 — UX traduzione**: **sostituzione completa del testo** in loco, con struttura, immagini,
  video e grafici preservati. Niente toggle "originale / tradotto" e niente vista bilingue.
- **D4 — Lingue target**: elenco fisso EN, IT, ES, FR, DE. Lingua di default: **italiano**
  (modificabile nelle opzioni).
- **D5 — Browser**: solo Chrome, per ora.
- **D6 — Nome e cartella**: `reader-mode-ai`, confermato.
- **D7 — Estrazione articolo**: `@mozilla/readability` **vendored** (MPL-2.0, con `NOTICE` nel
  bundle). L'obbligo di licenza è a livello di file: eventuali modifiche a `readability.js`
  restano open source, il resto dell'estensione non è vincolato.

# Piano

Stack proposto: JavaScript vanilla (niente framework UI), **esbuild** come unico bundler
(i content script MV3 non accettano ES modules nativi), **Vitest + jsdom** per i test unitari,
**Playwright** (persistent context con estensione caricata) per gli e2e.

Struttura prevista:

```
reader-mode-ai/
├── package.json / build.mjs / .gitignore / README.md
├── src/
│   ├── manifest.json
│   ├── background/service-worker.js     # router messaggi, fetch verso i provider
│   ├── content/content.js               # entry: toggle, shortcut, auto-detect
│   ├── content/extract.js               # estrazione articolo (+ fallback)
│   ├── content/overlay.js               # shadow DOM, render reader
│   ├── content/reader.css.js            # CSS del reader (temi, tipografia)
│   ├── content/toolbar-ui.js            # barra: tema/font/corpo/lingua/traduci
│   ├── translate/chunker.js             # blocchi testuali + markup inline
│   ├── translate/pipeline.js            # orchestrazione blocchi → provider → render
│   ├── translators/base.js              # interfaccia + retry/backoff
│   ├── translators/deepl.js
│   ├── translators/openai-compat.js     # include endpoint custom (test, Ollama)
│   ├── shared/settings.js / messages.js / cache.js
│   ├── options/options.html|js|css
│   ├── vendor/readability.js            # solo se D7 = vendored (con NOTICE)
│   └── _locales/en|it/messages.json
└── tests/
    ├── fixtures/*.html                  # pagine reali semplificate
    ├── unit/*.test.js
    └── e2e/*.spec.js + stub-server.mjs  # fake endpoint OpenAI-compatibile
```

## Fette

- [x] **Fetta 1 — Scaffold e tooling**
  - File: `package.json`, `build.mjs` (esbuild → `dist/`), `src/manifest.json`,
    `src/background/service-worker.js` (echo messaggi), `src/content/content.js` (minimale),
    `.gitignore`, `README.md`.
  - Test da scrivere: `tests/unit/manifest.test.js` — manifest MV3 valido, entrypoints
    dichiarati, nessun permesso superfluo; build produce i file attesi in `dist/`.
  - Criteri di accettazione: `npm run build` genera un `dist/` caricabile con "Load unpacked"
    senza errori nella chrome://extensions; `npx vitest run tests/unit/manifest.test.js` verde.
  - Comando: `npx vitest run tests/unit/manifest.test.js`

- [x] **Fetta 2 — Estrazione articolo**
  - File: `src/content/extract.js`, `src/vendor/readability.js` + `NOTICE`,
    `tests/fixtures/article-clean.html`, `article-noisy.html`, `article-media.html`,
    `listing.html`.
  - Test: `tests/unit/extract.test.js` — titolo/byline/data estratti; paragrafi nell'ordine
    giusto; nav/ads/footer/sidebar scartati; figure/immagini/video/embed preservati nel
    contenuto estratto (D3, fixture `article-media.html`); fallback euristico senza
    Readability; su `listing.html` l'estrazione segnala "nessun articolo" invece di restituire
    spazzatura.
  - Criteri: API `extractArticle(document) → {title, byline, date, content}` stabile e testata
    sulle fixture; media intatti e nella posizione originale del testo; nessun throw su DOM
    malformato.
  - Comando: `npx vitest run tests/unit/extract.test.js`

- [x] **Fetta 3 — Overlay reader stile Safari + toggle**
  - File: `src/content/overlay.js`, `src/content/reader.css.js`, `src/content/content.js`
    (toggle da icona e shortcut, es. `Alt+R`), `src/manifest.json` (`commands`, `action`).
  - Test da scrivere: `tests/unit/overlay.test.js` (render in jsdom: header titolo/byline,
    body senza script/iframe); `tests/e2e/reader-toggle.spec.js` (attiva/disattiva da icona e
    shortcut, overlay in shadow DOM, pagina originale ripristinata identica).
  - Criteri: stile tipo Safari Reader — serif ~19–20px, colonna ~36em centrata, interlinea
    ~1.5, header con titolo grande + byline/data, nessuno stile della pagina che trapela;
    disattivando si torna esattamente alla pagina di partenza (scroll incluso).
  - Comando: `npx vitest run tests/unit/overlay.test.js && npx playwright test tests/e2e/reader-toggle.spec.js`

- [x] **Fetta 4 — Impostazioni di lettura (tema, font, corpo)**
  - File: `src/content/toolbar-ui.js`, `src/content/reader.css.js` (temi: bianco, sepia,
    grigio, scuro; font serif/sans; corpo − / +), `src/shared/settings.js` (persistenza
    `chrome.storage`), `src/options/*` (shell).
  - Test: `tests/unit/settings.test.js` (schema, default, migrazioni, valori non validi
    ignorati), `tests/unit/toolbar-ui.test.js`; `tests/e2e/reader-settings.spec.js` (il tema
    scelto persiste alla riattivazione e su un'altra scheda).
  - Criteri: tutte le impostazioni persistono e si applicano senza ricaricare la pagina;
    la toolbar non rompe il layout del reader.
  - Comando: `npx vitest run tests/unit/settings.test.js tests/unit/toolbar-ui.test.js && npx playwright test tests/e2e/reader-settings.spec.js`

- [x] **Fetta 5 — Adapter traduttori + service worker + options page**
  - File: `src/translate/chunker.js`, `src/translators/{base,deepl}.js`,
    `src/background/service-worker.js` (router), `src/shared/cache.js`, `src/options/*`
    (chiave DeepL, lingua default italiano, endpoint override per i test).
  - Test: `tests/unit/chunker.test.js` (spezzatura per blocchi sotto il limite di caratteri,
    id stabili, markup inline intatto, nodi media esclusi dalla traduzione),
    `tests/unit/translators.test.js` (fetch mockate: DeepL con `tag_handling=html` e
    `preserve_formatting=1`, gestione 401/429/5xx, endpoint override per lo stub server),
    `tests/unit/cache.test.js` (round-trip per hash contenuto + lingua).
  - Criteri: una stringa con markup inline (`<strong>`, `<a>`) esce tradotta con i tag
    preservati; i nodi media non vengono mai inviati al provider; la chiave API sta solo in
    `chrome.storage` e non compare mai in log o messaggi d'errore; l'adapter implementa
    `translateBlocks(blocks, targetLang)` (interfaccia provider-agnostica, oggi solo DeepL).
  - Comando: `npx vitest run tests/unit/chunker.test.js tests/unit/translators.test.js tests/unit/cache.test.js`

- [x] **Fetta 6 — Pipeline di traduzione nella UI reader**
  - File: `src/translate/pipeline.js`, `src/content/toolbar-ui.js` (selettore lingua tra le 5
    fisse, default italiano; pulsante "Traduci"; barra di progresso), `src/content/overlay.js`
    (sostituzione in loco del testo, stati di errore).
  - Design: ogni blocco è una singola richiesta content → service worker (nessuno stato lungo
    nello SW: sopravvive al kill); cache per (hash contenuto, lingua) usata alla riattivazione;
    sostituzione completa del testo: si traducono solo i text node — immagini, video, grafici e
    struttura restano intatti al loro posto (D3).
  - Test: `tests/unit/pipeline.test.js` (provider fake, ordine, ripresa da cache, errore su un
    blocco non azzera gli altri, i nodi media non vengono toccati);
    `tests/e2e/translate.spec.js` con `tests/e2e/stub-server.mjs` (fake DeepL endpoint locale,
    iniettato via endpoint override).
  - Criteri: traduzione per blocchi con progresso visibile; sostituzione completa del testo con
    markup inline preservato; immagini/video/grafici intatti e nella posizione originale;
    seconda attivazione sulla stessa pagina = 0 chiamate allo stub (cache hit).
  - Comando: `npx vitest run tests/unit/pipeline.test.js && npx playwright test tests/e2e/translate.spec.js`

- [x] **Fetta 7 — Robustezza e UX**
  - File: `src/translators/base.js` (retry/backoff su 429/5xx), `src/translate/pipeline.js`
    (stati d'errore recuperabili, stima caratteri/costo prima di tradurre),
    `src/content/content.js` + `src/background/service-worker.js` (auto-detect leggibilità →
    badge/icona attiva sulle pagine articolo), `src/_locales/en|it/messages.json` (UI
    localizzata).
  - Test: `tests/unit/retry.test.js` (429 → 200 con backoff, esaurimento tentativi),
    `tests/e2e/autodetect.spec.js` (badge attivo su fixture articolo, inattivo su listing).
  - Criteri: nessun errore non gestito in console; traduzione annullabile; UI it/en completa.
  - Comando: `npx vitest run tests/unit/retry.test.js && npx playwright test tests/e2e/autodetect.spec.js`

- [x] **Fetta 8 — Rilascio**
  - File: `docs/operations/release.md` (packaging, checklist Web Store), `docs/privacy.md`
    (cosa viene inviato al provider AI), `README.md`, script `npm run zip`, `_locales` complete.
  - Test: `tests/unit/permissions.test.js` (fallisce se il manifest dichiara permessi oltre la
    allowlist concordata); smoke e2e finale dell'intero flusso.
  - Criteri: zip caricabile dal Chrome Web Store Dashboard; permessi minimi (nota: i content
    script su `<all_urls>` sono inevitabili per un reader, ma nient'altro); privacy policy
    pubblicata prima della submit.
  - Comando: `npx vitest run tests/unit/permissions.test.js && npx playwright test`

# Current handoff

Tutte le fette 1–8 completate il 2026-10-09, in sessione unica su richiesta
dell'utente (deviazione dalla procedura "una fetta per sessione"). Commits in `main`:
scaffold, extract, reader, settings, translate (adapter), translate (pipeline), ux,
release.

Verificato in questa sessione:

- suite unitaria: **71/71 verdi** (`npm test`, 13 file);
- suite e2e: **7/7 verdi** (`npm run test:e2e`, Chromium headless con estensione
  caricata da `dist/` e stub DeepL locale);
- `npm run build` → `dist/` completo; `npm run zip` → `reader-mode-ai-v0.1.0.zip`.

Non verificato (da fare manualmente):

- chiamate reali all'API DeepL: i test usano solo lo stub locale;
- caricamento di `dist/` in Chrome e i comandi icona / `Alt+R` (Playwright non può
  cliccare la toolbar del browser);
- icone Web Store: ancora da produrre (vedi `docs/operations/release.md`).

Prossimi passi: smoke test manuale con chiave DeepL Free (checklist in
`docs/operations/release.md`) → icone → `review` → eventuale submit.
