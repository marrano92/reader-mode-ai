---
title: "Pubblicazione open source e diffusione di Reader Mode AI"
status: "draft"
owner: "andrea.marrano"
last_updated: "2026-10-09"
type: "analysis"
tags: ["pubblicazione", "open-source", "chrome-web-store", "diffusione"]
---

# Contesto

L'estensione è completa e testata (fette 1–8 del piano più tre interventi successivi:
traduzione del titolo, animazione, memoria degli articoli tradotti). L'obiettivo è
pubblicarla come **progetto open source gratuito** e farla conoscere a utenti reali.
Non esistono backend né monetizzazione: l'utente porta la propria chiave DeepL Free.

# Ambito

- Pubblicazione del codice come repository pubblico con licenza open source.
- Pubblicazione su Chrome Web Store (e potenzialmente altri store).
- Attività di diffusione a costo zero.
- Fuori ambito: monetizzazione, backend propri, supporto commerciale.

# Risultati

## 1. Prerequisiti per il codice open source

- **Licenza**: manca del tutto. MIT è la scelta tipica (massima adozione, minimo
  attrito); MPL-2.0 di Readability è compatibile (copyleft a livello di file, il
  `NOTICE` già presente è sufficiente). Alternativa: GPL-3.0 se si vuole copyleft
  forte, ma riduce i riusi.
- **README bilingue**: oggi è in italiano; per la diffusione serve una sezione inglese
  (o un README-en.md), con GIF/screenshot del reader e della traduzione.
- **CI**: GitHub Actions che esegue `npm test` + `npm run test:e2e` a ogni push — per un
  progetto estensioni è il segnale di serietà più economico che esista.
- File di contorno utili: `CONTRIBUTING.md`, `CHANGELOG.md`, issue template minima.
- Pubblicare su GitHub con topic esplicativi (`chrome-extension`, `reader-mode`,
  `deepl`, `readability`, `manifest-v3`) e nome repository coerente.

## 2. Prerequisiti per Chrome Web Store

- **Registrazione sviluppatore**: una tantum di 5 USD (verificare l'importo corrente).
- **Icone 16/32/48/128 px**: ancora mancanti — è l'unico blocco tecnico reale.
- **Privacy policy con URL pubblico**: obbligatoria perché l'estensione invia il testo
  delle pagine a DeepL. `docs/privacy.md` è pronto, va pubblicato (GitHub Pages o
  semplicemente il blob GitHub).
- **Questionario dati utente**: dichiarare che il contenuto della pagina viene trasmesso
  a un terzo (DeepL) quando l'utente attiva la traduzione; mancare questa dichiarazione
  è la causa n.1 di rifiuto in revisione.
- **Listing**: descrizione, screenshot per ogni tema, categoria "Productivity",
  giustificazione permessi (`storage`, host DeepL, content script su `<all_urls>`).
- **Nome e marchi**: "Reader Mode AI" è utilizzabile; **non** inserire "Safari" o
  "Apple" nel nome o nei keyword dello store (marchi registrati). "Ispirato a Safari
  Reader" resta nel README GitHub, non nel listing. Per DeepL: "powered by DeepL API"
  è corretto, senza suggerire affiliazione.
- Tempi di revisione: tipicamente giorni–settimane; MV3 è richiesto (già rispettato).

## 3. Canali di diffusione a costo zero

| Canale | Perché funziona | Impegno |
|---|---|---|
| Show HN (Hacker News) | pubblico tecnico sensibile al "reader mode" | un post onesto con problem/solution |
| Reddit (r/chrome, r/webextensions, r/productivity) | utenti finali che cercano esattamente questo | un post, risposte ai commenti |
| Articolo dev.to / Medium | "come ho costruito un reader mode con MV3 e DeepL" — contenuto evergreen + link | mezza giornata |
| AlternativeTo, Product Hunt | directory dove la gente cerca alternative a Pocket/Reader View | scheda prodotto |
| Issue/PR su repo di liste awesome (awesome-chrome-extensions) | backlink stabili | una PR |
| Localizzazione it/en già pronta | piccolo vantaggio competitivo sulle nicchie italiane | già fatto |

## 4. Punti di attrito reali da mitigare nel messaggio

- **Chiave DeepL obbligatoria**: è il principale ostacolo all'adozione. Va messa subito
  nel listing: "gratuita, 1 minuto per registrarsi" — meglio una GIF di onboarding che
  una frase.
- **Percorso alternativo senza chiave** (es. Chrome built-in AI o traduttore locale):
  futura evoluzione, non bloccante per il lancio.
- **Crowding**: "reader mode" è uno spazio affollato; il differenziatore vero è
  *lettura elegante + traduzione in-place con media preservati e cache*: va in primo
  piano in ogni comunicazione.

# Rischi

| Rischio | Impatto | Mitigazione |
|---|---|---|
| Rifiuto in revisione per dichiarazioni dati | ritardo settimane | questionario compilato onestamente; privacy policy online prima del submit |
| Nome troppo generico per la SEO store | poca scoperta | keyword mirate ("reader mode", "distraction free", "translate article") + screenshot |
| Manutenzione post-lancio (issue, compatibilità Chrome) | tempo | CI + buona copertura test già presente; definire "best effort" nel README |
| Utenti senza chiave API che abbandonano | tassi di installazione/uso | GIF onboarding + FAQ nel README; valutare provider senza chiave in v2 |
| Marchi (Apple/Safari/DeepL) | rimozione listing | nessun riferimento a Safari/Apple nel listing store |

# Raccomandazioni

Sequenza consigliata (ogni fase è autonoma):

1. **Fase 1 — repo open source**: LICENSE MIT, README con sezione inglese e GIF,
   CONTRIBUTING.md, GitHub Actions CI, screenshot. → mezza giornata di lavoro.
2. **Fase 2 — Chrome Web Store**: icone, privacy policy su URL pubblico, listing,
   questionario dati, submit. → 1 giornata + attesa revisione.
3. **Fase 3 — diffusione**: Show HN + Reddit + articolo tecnico, poi directory.
4. **Opzionale — Firefox Android** (vedi analisi precedente): amplia il pubblico mobile
   a costo contenuto.

# Prossimi passi

Decisioni da prendere prima di partire:

- **Licenza**: MIT (consigliata) vs GPL-3.0 vs altre.
- **Repository**: nome e hosting (GitHub consigliato) — pubblico da subito o dopo le icone?
- **Chi prepara le icone**: asset grafico esterno o generazione semplice (solo placeholder
  minimali, da rifare)?
- Conferma di procedere con la Fase 1, che è interamente automatizzabile in sessione.
