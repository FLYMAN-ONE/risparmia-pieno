# Formato dei file MIMIT

Note raccolte il 18/11/2026 scaricando i file reali. Se il Ministero cambia formato, si aggiorna qui.

Fonte: [MIMIT, Carburanti: prezzi praticati e anagrafica degli impianti](https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti), licenza IODL 2.0.

## I due file

| File | Indirizzo | Peso | Righe |
|---|---|---|---|
| Anagrafica | `https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv` | 3,6 MB | ~23.960 distributori |
| Prezzi alle 8 | `https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv` | 3,9 MB | ~92.780 prezzi |

- Pubblicati ogni mattina: il 18/11 i file risultavano modificati alle 07:45-07:51 UTC (08:45-08:51 in Italia).
- Contengono i prezzi **in vigore alle 8 del giorno precedente**. Riga 1: `Estrazione del 2026-11-17`.
- Codifica UTF-8, righe separate da `\n`, l'ultima riga senza "a capo" finale.

## Struttura

Riga 1: data di estrazione. Riga 2: intestazione. Dalla riga 3: i dati.
**Separatore: `|`** (dal 10 febbraio 2026; prima era `;`).

**Anagrafica**: `idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine`

**Prezzi**: `idImpianto|descCarburante|prezzo|isSelf|dtComu`
- `prezzo` con il punto decimale (`1.969`);
- `isSelf`: `1` self, `0` servito;
- `dtComu`: data della comunicazione del gestore, `gg/mm/aaaa hh:mm:ss`.

## Insidie trovate

1. **Il separatore compare dentro i testi.** 115 righe dell'anagrafica hanno 11 o 12 campi invece di 10, per esempio `STOIL SIMPLE | gestori.prezzibenzina.it` nel nome. Nessuna di queste righe usa le virgolette. Soluzione: leggere `idImpianto` dall'inizio e gli ultimi 5 campi (indirizzo, comune, provincia e coordinate) dalla fine. I campi centrali si ricostruiscono partendo dal "Tipo Impianto", che ha pochi valori noti.
2. **Virgolette spaiate**: per esempio `"MEGA SERVICE S.A.S. ...` senza la virgoletta di chiusura. Una libreria CSV "standard" le interpreterebbe male, quindi conviene leggere riga per riga dividendo a `|` e togliere le virgolette ai bordi.
3. **Tab e spazi doppi** dentro nomi e indirizzi.
4. **119 distributori senza coordinate** (vuote o zero).
5. **Prezzi anomali**: 9 sotto 0,50 € (es. `0.100`) e 18 sopra 3 € (fino a `8.888`).
6. **Prezzi molto vecchi**: 153 prezzi comunicati prima del 2026, alcuni dal 2013.
7. **59 nomi diversi di carburante** (Benzina, Gasolio, Blue Diesel, HVOlution, GNL, L-GNC…), da ricondurre alle categorie.
8. 2.298 distributori in anagrafica non hanno prezzi; tutti i prezzi hanno invece un distributore.
9. 5.482 comuni distinti, utili per l'indice di ricerca.

## Raggiungibilità

- Dal Mac (Italia): ok, circa 3 secondi per file.
- **Dai server di GitHub Actions: non raggiungibile** (timeout di connessione, prova del 18/11/2026; anche dati.gov.it risponde 403).
- Soluzione scelta: i file li scarica l'iPhone con un Comando Rapido e li consegna a GitHub. Vedi `COMANDO-RAPIDO.md`.
