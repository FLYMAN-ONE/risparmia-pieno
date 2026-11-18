# Dati di prova

Piccolo campione **reale** dei file MIMIT del 17/11/2026 (estrazione "Estrazione del 2026-11-17"), usato dai test della cucina. Contiene 28 distributori e i loro 125 prezzi, copiati senza modifiche, compresi i difetti originali e l'assenza dell'"a capo" finale.

Fonte: Ministero delle Imprese e del Made in Italy, Osservaprezzi Carburanti, licenza IODL 2.0.

## Perché questi distributori

| idImpianto | Caso |
|---|---|
| 41799, 41800, 28790, 10555, 10817, 17205, 40509, 48492 | normali, tutti a Gallarate (utili anche per la ricerca per comune) |
| 23316, 56803 | il separatore `\|` compare nel nome: 11 campi invece di 10 |
| 40820 | il separatore `\|` compare due volte: 12 campi |
| 46593 | virgoletta di apertura senza chiusura |
| 5512 | gestore tra virgolette |
| 63381 | carattere tab dentro il nome |
| 60502, 60116 | coordinate mancanti |
| 50432, 3535 | distributori autostradali |
| 7842 | distributore senza prezzi |
| 55136 | prezzo troppo basso (0,100 €) |
| 60012 | prezzo troppo alto (oltre 5 €) |
| 6471 | prezzo comunicato nel 2013 |
| 49230, 64022, 9254, 59183, 63056, 60123 | carburanti particolari: Metano, GNL, HVO, HVOlution, Blue Diesel, Gasolio artico |

Se il Ministero cambia formato, si aggiunge un nuovo campione accanto a questo, senza cancellarlo.
