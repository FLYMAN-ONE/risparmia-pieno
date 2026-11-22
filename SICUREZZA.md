# Checklist di sicurezza e privacy — Risparmia Pieno

Controlli fatti prima di dare l'app alla famiglia (fase 9). Ognuno dice **cosa** si è controllato, **come** e **il risultato**.
I punti segnati con ✋ li fa o li conferma chi gestisce l'app, sul proprio telefono.

## 1. La posizione non esce dal telefono

- [x] **Nessuna richiesta contiene le coordinate.** Provata l'app completa nella versione pubblicata (Intorno a me, filtri, raggio, scheda, ricerca di un comune, impostazioni, mappa con tutti e tre i colori, riquadro del distributore): nessun indirizzo richiesto contiene latitudine o longitudine. *19/11/2026*
- [x] **Solo due siti contattati:** l'app stessa (GitHub Pages) e le tessere di OpenFreeMap, e quest'ultimo solo aprendo la mappa. La vista Lista non contatta nessuno. Lo controllano anche i test in `app/src/privacy.test.ts`. *19/11/2026*
- [x] **Le richieste della mappa partono senza "referrer"**: OpenFreeMap non sa da quale sito arrivano. Come ogni mappa, riceve i pezzi di cartina della zona guardata, non la posizione. *19/11/2026*
- [x] **Lista degli invitati (CSP)** nella pagina pubblicata: il browser blocca qualunque contatto non previsto, codice esterno ed `eval`. Nessuna violazione durante la prova completa. *19/11/2026*

## 2. La posizione non si salva

- [x] **Memoria del browser controllata dopo la prova completa:** localStorage contiene solo le scelte (carburante, self/servito, raggio, tema, colore della mappa); sessionStorage vuoto; nessun cookie; nessun database IndexedDB; la Cache contiene solo i file dell'app e il file nazionale dei prezzi. Nessuna coordinata da nessuna parte. *19/11/2026*
- [x] **Il comune cercato e il punto della mappa spostata** restano solo in memoria, come la posizione, e spariscono chiudendo l'app. *19/11/2026*
- [x] **Il GPS si chiede solo al tocco di "Intorno a me"**, mai all'apertura. *19/11/2026*

## 3. Codice e librerie

- [x] **Librerie:** una sola nell'app (MapLibre 6.19.0), più quattro strumenti di lavoro. `npm audit`: 0 vulnerabilità note; `npm outdated`: tutte all'ultima versione. *19/11/2026*
- [x] **Nessun segreto nel repository** (chiavi, token, password): cercati, nessuno trovato. La chiave GitHub del Comando Rapido sta solo sull'iPhone. *19/11/2026*
- [x] **Automazioni GitHub** con permessi minimi e azioni bloccate su una versione precisa. *19/11/2026*
- [x] **296 test automatici** passano a ogni modifica, compresi quelli di privacy e della CSP. *19/11/2026*

## 4. Prestazioni

- [x] **App già installata:** pagina pronta in 0,03 s; dal tocco su "Intorno a me" alla lista 0,05 s, più il tempo del GPS. *Misurato sul sito pubblicato, 19/11/2026*
- [x] **Prima visita in assoluto:** pagina pronta in 0,5 s; il file dei prezzi (1 MB compresso) dipende dalla rete, circa 5 s nella prova. Succede una volta sola: poi i prezzi sono subito sul telefono. *19/11/2026*
- [ ] ✋ *(facoltativo)* **Lighthouse su telefono:** su https://pagespeed.web.dev incolla l'indirizzo dell'app e guarda il punteggio "Mobile". Claude non l'ha fatto perché significherebbe mandare l'indirizzo del progetto a un servizio esterno senza permesso.

## 5. Prova completa sui telefoni ✋

- [x] **iPhone:** installata dalla Home; Intorno a me, filtri, ricerca, mappa, Naviga, impostazioni; in modalità aereo si apre con gli ultimi prezzi. *22/11/2026*
- [x] **Android:** installata da Chrome (menu ⋮ → Installa app); stesse prove. *22/11/2026*

## Firma

L'app è pronta per la famiglia.

Firmato: approvata da chi gestisce l'app, dopo le prove sui telefoni   Data: 22/11/2026
