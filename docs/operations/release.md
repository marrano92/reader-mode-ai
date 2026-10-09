# Rilascio di Reader Mode AI

Runbook per build, verifica e pubblicazione dell'estensione.

## Build e packaging

```bash
npm ci            # dipendenze esatte dal lockfile
npm test          # suite unitaria
npm run test:e2e  # suite e2e (richiede: npx playwright install chromium)
npm run build     # bundle in dist/
npm run zip       # reader-mode-ai-v<version>.zip pronto per lo store
```

## Checklist Chrome Web Store

- [ ] **Icone** 16/32/48/128 px in PNG: *mancano*, da produrre e dichiarare nel
      manifest (`icons` / `action.default_icon`). Ultimo ostacolo per la submit.
- [ ] Pubblicare `docs/privacy.md` come privacy policy online e inserirne l'URL nel
      form di submission (obbligatoria: l'estensione invia testo a DeepL).
- [ ] Screenshot della modalità lettura (almeno uno per tema) e descrizione store.
- [ ] Giustificazione permessi nel form: `storage` per impostazioni/chiave/cache,
      host `api-free.deepl.com`/`api.deepl.com` per la traduzione, content script su
      `<all_urls>` perché il reader si attiva su qualunque pagina articolo.
- [ ] Dichiarare nel form che i testi delle pagine vengono trasmessi a DeepL.

## Verifica manuale pre-release (smoke)

1. `npm run build`, poi `chrome://extensions` → "Carica estensione non pacchettizzata" → `dist/`.
2. Aprire un articolo reale: badge `R` visibile sull'icona.
3. `Alt+R` e click sull'icona attivano/disattivano il reader; la pagina resta integra.
4. Temi (bianco/seppia/grigio/scuro), font e corpo si applicano e persistono dopo
   ricarica e su altre schede.
5. Impostazioni → inserire chiave **DeepL API Free**; il pulsante "Traduci" mostra la
   stima dei caratteri; traduzione completa con immagini/video al loro posto.
6. Chiudere e riattivare: "Traduci" sulla stessa pagina non genera chiamate API
   (cache); provare "Annulla" durante una traduzione lunga.
7. Pagina senza articolo (es. homepage): compare il messaggio di assenza articolo.

## Rollback

Niente backend: basta disinstallare l'estensione o ricaricare la versione precedente
di `dist/`. I dati locali (chiave, cache) spariscono con la disinstallazione.

## Note operative

- La suite e2e usa uno stub DeepL locale (`tests/e2e/stub-server.mjs`) configurato via
  endpoint override nelle opzioni: nessun test invia dati reali.
- Le chiamate reali a DeepL non sono coperte dai test: la verifica con chiave Free
  reale è punto 5 dello smoke test.
