# Risparmia Pieno

[![Test](https://github.com/FLYMAN-ONE/risparmia-pieno/actions/workflows/test.yml/badge.svg)](https://github.com/FLYMAN-ONE/risparmia-pieno/actions/workflows/test.yml)

Una web app da installare sul telefono che mostra, su mappa e in lista, i distributori di carburante più economici intorno a te o in un comune che scegli.

App: https://flyman-one.github.io/risparmia-pieno/

## Installarla sul telefono

- **iPhone:** apri l'indirizzo in **Safari** → tasto Condividi → **Aggiungi alla schermata Home**. Poi apri l'app dalla Home una volta con la rete: da lì funziona anche offline.
- **Android:** apri l'indirizzo in **Chrome** → menu ⋮ → **Installa app** (o "Aggiungi a schermata Home").

Non serve aggiornarla: le versioni nuove arrivano da sole alla riapertura.

## Come funziona

L'app ha due parti separate, che non si parlano mai in tempo reale:

1. **La cucina dei dati** (`cucina/`). Ogni giorno l'iPhone scarica i prezzi ufficiali del Ministero e li consegna a GitHub, perché il sito del Ministero non risponde ai server di GitHub (vedi [`cucina/COMANDO-RAPIDO.md`](cucina/COMANDO-RAPIDO.md)). Su GitHub uno script li controlla e li compatta in un unico file nazionale, uguale per tutti, pubblicato su https://flyman-one.github.io/risparmia-pieno/dati/prezzi.json
2. **L'app** (`app/`). Gira sul telefono: scarica quel file e calcola i distributori vicini **solo sul telefono**.

## Privacy

- La tua posizione **non lascia mai il telefono** e non viene salvata. Lo stesso vale per il comune cercato e per il punto dove sposti la mappa.
- Il GPS si chiede solo quando tocchi "Intorno a me".
- Niente account, statistiche, cookie o servizi di terze parti.
- Il file dei prezzi è uno solo, uguale per tutta Italia: scaricarlo non dice dove sei.
- L'unico servizio esterno è OpenFreeMap, per le tessere della mappa, chiamato senza dire da quale sito arriva la richiesta. Come ogni mappa, riceve i pezzi di cartina della zona che guardi, non la tua posizione. La vista Lista non contatta nessuno.
- Sul telefono restano solo: le tue scelte (carburante, self/servito, raggio, tema, colore della mappa), i file dell'app e l'ultimo file dei prezzi, per funzionare senza rete. Le tessere della mappa non vengono conservate dall'app.
- La pagina contiene una "lista degli invitati" (Content Security Policy, `app/src/sicurezza/csp.ts`): il browser blocca qualunque contatto con siti diversi da OpenFreeMap. Aggiungere un sito richiede di cambiare quella lista, e un test lo segnala.

## Struttura delle cartelle

| Cartella | Cosa contiene |
|---|---|
| `cucina/` | Lo script che prepara ogni giorno il file dei prezzi, con i suoi test |
| `app/` | L'app per il telefono, divisa per compiti (dati, posizione, lista, mappa, ricerca, impostazioni, stile) |
| `condiviso/` | Le regole comuni alle due parti: formato del file prezzi e categorie dei carburanti |
| `.github/workflows/` | Le automazioni di GitHub: test, ricezione dei dati, pubblicazione e controllo serale |

## Comandi utili

Da scrivere nel Terminale, dentro la cartella del progetto.

| Comando | Cosa fa |
|---|---|
| `npm install` | Scarica gli strumenti di lavoro (solo la prima volta, o dopo un aggiornamento) |
| `npm test` | Esegue tutti i test: devono risultare tutti "passed" |
| `npm run check` | Controlla il codice con TypeScript: se non scrive nulla, è tutto a posto |
| `npm run dev` | Apre l'app in anteprima su http://localhost:5173 |
| `npm run campionario` | Apre l'anteprima anche agli altri dispositivi del Wi-Fi di casa: dal telefono vai su http://IP-del-Mac:5173/campionario/ |
| `npm run build` | Prepara la versione finale dell'app nella cartella `dist/` |
| `npm run cucina -- <cartella CSV> <file.json>` | Legge i due file MIMIT, li controlla e scrive il file nazionale dei prezzi |

Gli stessi controlli (TypeScript, test e costruzione dell'app) girano da soli su GitHub a ogni modifica. Se qualcosa non va, accanto all'ultima modifica compare una X rossa e GitHub manda un'email.

## Fonte dei dati

Prezzi e anagrafica dei distributori: Ministero delle Imprese e del Made in Italy (MIMIT), Osservaprezzi Carburanti, rilasciati con licenza [IODL 2.0](https://www.dati.gov.it/iodl/2.0/).

## Riconoscimenti

- Mappa: [OpenFreeMap](https://openfreemap.org), dati © [OpenStreetMap](https://www.openstreetmap.org/copyright), disegnata con [MapLibre GL JS](https://maplibre.org) (licenza BSD-3).
- Carattere: Titillium Web (licenza SIL Open Font License), incluso nell'app.
- Icone: [Lucide](https://lucide.dev) (licenza ISC), incluse nell'app.

## Cosa fare se…

Questa sezione si completa durante lo sviluppo.

- **…ricevo un'email "Controllo serale" fallito:** oggi i prezzi non sono arrivati. Avvia a mano sull'iPhone il Comando Rapido *Consegna dati MIMIT*. Se dà errore, vedi la sezione "Cosa fare se…" di [`cucina/COMANDO-RAPIDO.md`](cucina/COMANDO-RAPIDO.md).
- **…ricevo un'email "Ricevi dati MIMIT" fallito:** i dati del giorno non hanno superato i controlli di qualità e **non sono stati pubblicati**: l'app continua con quelli del giorno prima. Apri l'azione su GitHub (scheda Actions) e leggi le righe dopo "NON PUBBLICO". Se è un problema del Ministero di un giorno, si risolve da solo con la consegna successiva. Se si ripete, probabilmente è cambiato il formato: vedi sotto.
- **…il Ministero cambia il formato dei file:** l'azione si ferma con "Prima riga inattesa" o "Intestazione cambiata". Nulla di sbagliato viene pubblicato. Va aggiornata la lettura in `cucina/src/leggi.ts` e le note in [`cucina/FORMATO-MIMIT.md`](cucina/FORMATO-MIMIT.md), aggiungendo un nuovo campione in `cucina/test/campioni/`.
- **…compare un carburante nuovo:** nel resoconto dell'azione c'è "ATTENZIONE: carburanti sconosciuti". Finisce in "Altro" finché non lo si aggiunge alla tabella in `cucina/src/carburanti.ts`.
- **…"Intorno a me" dice subito "Posizione non disponibile" su iPhone, senza chiedere il permesso:** il telefono blocca la posizione per il sito, anche se Safari in generale ce l'ha. Controlla, in ordine:
  1. Impostazioni → Privacy e sicurezza → Localizzazione → Siti web di Safari: "Mentre usi l'app";
  2. in Safari, sulla pagina dell'app: icona a sinistra dell'indirizzo → Impostazioni sito web → Posizione: "Consenti" o "Chiedi", non "Rifiuta";
  3. Tempo di utilizzo → Restrizioni contenuti e privacy → Localizzazione: consentita.

  Se invece il messaggio arriva dopo qualche secondo, il telefono non trova la posizione: riprova all'aperto. Se la pagina è aperta dentro un'altra app (WhatsApp, Telegram…), aprila in Safari.
- **…l'app dice "Prezzi di N giorni fa":** l'aggiornamento automatico non è arrivato. Segui i primi due punti di questa lista (email "Controllo serale" o "Ricevi dati MIMIT"). Intanto l'app funziona con gli ultimi prezzi e lo dice.
- **…l'app dice "Sei offline":** il telefono non ha rete. Lista e prezzi funzionano con l'ultimo file scaricato; la mappa torna quando torna la rete.
- **…il sito non si apre:**
  1. se l'app è già installata, si apre comunque con gli ultimi prezzi: il problema riguarda solo gli aggiornamenti;
  2. controlla lo stato di GitHub su https://www.githubstatus.com (voce "Pages"): se è un guasto loro, si risolve da solo;
  3. su GitHub, scheda **Actions**, guarda l'ultima azione "Pubblica": se è rossa, aprila e leggi l'errore; si può rilanciare con **Re-run jobs**;
  4. in **Settings → Pages** del repository deve esserci "Your site is live". Se il sito risulta spento, la sorgente deve essere "GitHub Actions".
- **…dopo una modifica il telefono mostra ancora la versione vecchia:** chiudi del tutto l'app (scorri via dalle app aperte) e riaprila; la versione nuova arriva da sola. Nella pagina Impostazioni e info, in fondo, c'è la data della versione. Da Safari, aggiungere `?v=` e un numero all'indirizzo scavalca la memoria del browser.
- **…la mappa dice "Mappa non disponibile":** manca la rete, oppure l'app è rimasta aperta durante un aggiornamento. Tocca di nuovo Mappa; se non basta, chiudi e riapri l'app.
- **…voglio aggiungere un servizio esterno (per esempio un'altra mappa):** va prima approvato (regola privacy 7). Poi si aggiunge in `app/src/sicurezza/csp.ts` e nei test `app/src/privacy.test.ts` e `app/src/sicurezza/csp.test.ts`, altrimenti il browser lo blocca.
