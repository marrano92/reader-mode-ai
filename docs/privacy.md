# Informativa privacy — Reader Mode AI

Estensione interamente client-side: non esiste alcun nostro server e non raccogliamo
alcun dato personale.

## Cosa tratta l'estensione

| Dato | Dove vive | Chi lo vede |
|---|---|---|
| Testo dell'articolo tradotto | inviato a DeepL **solo** quando l'utente preme "Traduci" | DeepL (DeepL GmbH), soggetto alle [condizioni di DeepL](https://www.deepl.com/privacy) |
| Chiave API DeepL | `chrome.storage.local` (non sincronizzata, mai inviata a terzi diversi da DeepL per l'autenticazione) | solo l'estensione |
| Traduzioni (cache) | `chrome.storage.local`, sul dispositivo | solo l'estensione |
| Impostazioni di lettura (tema, font, corpo, lingua) | `chrome.storage.sync` (servizio di sincronizzazione dell'account Google dell'utente) | solo l'utente |

## Cosa NON fa l'estensione

- nessuna raccolta di statistiche, analytics o telemetria;
- nessun invio di dati a server propri (non ne esistono);
- nessun invio di testo a provider AI all'infuori di DeepL;
- nessuna lettura della cronologia di navigazione: il content script legge solo la
  pagina su cui l'utente attiva l'estensione.

## Conservazione

Le traduzioni in cache restano sul dispositivo finché l'utente non rimuove l'estensione
o non cancella i dati del browser. Nessun dato è conservato altrove.

## Contatti

Titolare del trattamento: `marrano92` (GitHub). Per richieste sulla privacy o per
chiedere la rimozione dei dati locali: issue su
<https://github.com/marrano92/reader-mode-ai/issues>.

Nota per la pubblicazione su store: sostituire questo contatto con un indirizzo
email dedicato prima della submit, se richiesto dalle policy dello store.
