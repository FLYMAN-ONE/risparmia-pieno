# Risparmia Pieno

[![Test](https://github.com/FLYMAN-ONE/risparmia-pieno/actions/workflows/test.yml/badge.svg)](https://github.com/FLYMAN-ONE/risparmia-pieno/actions/workflows/test.yml)

Una web app da installare sul telefono che mostra, su mappa e in lista, i distributori di carburante più economici intorno a te o in un comune che scegli.

> Progetto in sviluppo. Questa pagina si completa man mano.

## Come funziona

L'app ha due parti separate, che non si parlano mai in tempo reale:

1. **La cucina dei dati** (`cucina/`). Ogni mattina, sui server di GitHub, uno script scarica i prezzi ufficiali del Ministero, li controlla e li compatta in un unico file nazionale, uguale per tutti.
2. **L'app** (`app/`). Gira sul telefono: scarica quel file e calcola i distributori vicini **solo sul telefono**.

## Privacy

- La tua posizione **non lascia mai il telefono** e non viene salvata.
- Il GPS si chiede solo quando tocchi "Intorno a me".
- Niente account, statistiche, cookie o servizi di terze parti.
- L'unico servizio esterno è OpenFreeMap, per le tessere della mappa. La vista Lista non contatta nessuno.

## Struttura delle cartelle

| Cartella | Cosa contiene |
|---|---|
| `cucina/` | Lo script che prepara ogni giorno il file dei prezzi, con i suoi test |
| `app/` | L'app per il telefono, divisa per compiti (dati, posizione, lista, mappa, ricerca, impostazioni, stile) |
| `condiviso/` | Le regole comuni alle due parti: formato del file prezzi e categorie dei carburanti |
| `.github/workflows/` | Le automazioni di GitHub: test e aggiornamento mattutino |

## Comandi utili

Da scrivere nel Terminale, dentro la cartella del progetto.

| Comando | Cosa fa |
|---|---|
| `npm install` | Scarica gli strumenti di lavoro (solo la prima volta, o dopo un aggiornamento) |
| `npm test` | Esegue tutti i test: devono risultare tutti "passed" |
| `npm run check` | Controlla il codice con TypeScript: se non scrive nulla, è tutto a posto |
| `npm run dev` | Apre l'app in anteprima su http://localhost:5173 |
| `npm run build` | Prepara la versione finale dell'app nella cartella `dist/` |

Gli stessi controlli (TypeScript, test e costruzione dell'app) girano da soli su GitHub a ogni modifica. Se qualcosa non va, accanto all'ultima modifica compare una X rossa e GitHub manda un'email.

## Fonte dei dati

Prezzi e anagrafica dei distributori: Ministero delle Imprese e del Made in Italy (MIMIT), Osservaprezzi Carburanti, rilasciati con licenza [IODL 2.0](https://www.dati.gov.it/iodl/2.0/).

## Cosa fare se…

Questa sezione si completa durante lo sviluppo.

- **…i prezzi non si aggiornano:** _da scrivere nella fase 2._
- **…il Ministero cambia il formato dei file:** _da scrivere nella fase 1._
- **…il sito non si apre:** _da scrivere nella fase 9._
