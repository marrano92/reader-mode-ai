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

- [x] **Icone** 16/32/48/128 px in PNG: generate con `npm run generate-icons`
      (placeholder: per il design definitivo basta sostituire i PNG in `src/icons/`).
- [ ] Pubblicare `docs/privacy.md` come privacy policy online: l'URL pubblico è
      <https://github.com/marrano92/reader-mode-ai/blob/main/docs/privacy.md>.
- [ ] Screenshot della modalità lettura (almeno uno per tema) e descrizione store
      (testi pronti nella sezione qui sotto).
- [ ] Giustificazione permessi nel form: `storage` per impostazioni/chiave/cache,
      host `api-free.deepl.com`/`api.deepl.com` per la traduzione, content script su
      `<all_urls>` perché il reader si attiva su qualunque pagina articolo.
- [ ] Dichiarare nel form che i testi delle pagine vengono trasmessi a DeepL.

## Testi per lo store (pronti all'uso)

**Name (dal pacchetto):** `Reader Mode AI`

**Summary (132 max, EN):** `Elegant, distraction-free reader mode with one-click DeepL
translation. Bring your own free API key.`

**Summary (132 max, IT):** `Modalità lettura elegante senza distrazioni con traduzione
DeepL in un click. Usa la tua chiave API gratuita.`

**Detailed description (EN):**

> Turn any article into a beautiful, distraction-free reading experience — and read it
> in your language.
>
> • Elegant reader mode: centered column, serif typography, title, byline and date.
> • Themes: white, sepia, gray and dark; adjustable font family and size, remembered.
> • One-click translation into English, Italian, Spanish, French and German, powered by
>   the DeepL API (free tier, bring your own key — takes one minute to get).
> • Images, video and charts keep their place and are NEVER sent to the translation
>   provider: only text is translated, inline formatting preserved.
> • Smart local caching: translated articles reopen already translated, with zero API
>   calls. Nothing leaves your browser except the text you choose to translate.
> • No accounts, no tracking, no servers of ours. Open source (MIT).
>
> Shortcuts: Alt+R toggles reader mode.

**Detailed description (IT):**

> Trasforma ogni articolo in una esperienza di lettura elegante e senza distrazioni —
> e leggilo nella tua lingua.
>
> • Modalità lettura elegante: colonna centrata, tipografia serif, titolo, autore e data.
> • Temi bianco, seppia, grigio e scuro; font e corpo regolabili e memorizzati.
> • Traduzione con un click in inglese, italiano, spagnolo, francese e tedesco, via
>   DeepL API (piano gratuito, con la tua chiave gratuita).
> • Immagini, video e grafici restano al loro posto e NON vengono mai inviati al
>   provider: si traduce solo il testo, preservando la formattazione.
> • Cache locale intelligente: gli articoli già tradotti si riaprono già tradotti, con
>   zero chiamate API. Nulla esce dal browser salvo il testo che scegli di tradurre.
> • Niente account, niente tracciamento, niente server nostri. Open source (MIT).

**Category:** Productivity · **Language:** English (listing IT opzionale).

## Pubblicazione automatica via GitHub Actions

La workflow `.github/workflows/release.yml` pubblica su Chrome Web Store quando viene
spinto un tag `v*`: test completi → build → zip → upload → publish.

### Setup una tantum

1. **Google Cloud Console** (<https://console.cloud.google.com>): crea un progetto →
   "API e servizi" → abilita **Chrome Web Store API** → "Credenziali" → crea un client
   OAuth 2.0 tipo **App desktop** → nota `client_id` e `client_secret`.
2. **Refresh token**: apri Google OAuth Playground
   (<https://developers.google.com/oauthplayground>) → Settings (⚙) → usa i tuoi client
   OAuth → campo "OAuth 2.0 scopes": `https://www.googleapis.com/auth/chromewebstore` →
   Authorize con l'account developer → "Exchange authorization code for tokens" →
   copia il **refresh token**.
3. **Prima versione**: carica manualmente lo zip dal dashboard (una volta sola, serve a
   creare l'item) e prendi l'**extension id** dall'URL del dashboard.
4. **GitHub** → Settings → Secrets and variables → Actions → New repository secret:

   | Secret | Valore |
   |---|---|
   | `CHROME_EXTENSION_ID` | extension id dal dashboard |
   | `CHROME_CLIENT_ID` | client_id GCP |
   | `CHROME_CLIENT_SECRET` | client_secret GCP |
   | `CHROME_REFRESH_TOKEN` | refresh token OAuth |

### Flusso di release

```bash
# 1. aggiorna CHANGELOG.md (sezione Unreleased -> nuova versione) e committa
# 2. bump versione (aggiorna package.json, commit e tag v0.1.1)
npm version patch    # o minor / major
# 3. push del commit e del tag: la workflow pubblica da sola
git push --follow-tags
```

La versione nel manifest viene iniettata da `package.json` al build: la fonte unica è
`npm version`, niente versioni duplicate da sincronizzare.

### Note e cautele

- La versione deve essere **strettamente crescente** rispetto a quella pubblicata, altrimenti
  lo store rifiuta l'upload.
- Ogni publish va in revisione: di solito automatica, manuale se il diff è considerato
  rischioso (es. nuovi permessi).
- Per rilasci a solo gruppo di test: sostituire il passo `publish` con l'opzione
  `--trusted-testers` del CLI.
- Il passo upload/publish usa `chrome-webstore-upload-cli`: alla prima esecuzione
  verificare nomi comandi/opzioni contro la documentazione corrente del pacchetto
  (non testabile in locale senza credenziali reali).

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
