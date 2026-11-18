# Il Comando Rapido che consegna i dati

I server di GitHub non riescono a raggiungere il sito del Ministero (mimit.gov.it): la connessione scade, come verificato il 18/11/2026. Per questo ogni mattina **l'iPhone** scarica i due file MIMIT e li consegna a GitHub, che poi li controlla e li elabora.

```
iPhone (Wi-Fi di casa)                      GitHub
1. scarica i 2 CSV dal Ministero
2. li mette in uno zip
3. carica lo zip nella release  ──────────► "dati-grezzi"
4. avvia l'azione               ──────────► "Ricevi dati MIMIT" (controlli, poi elaborazione)
```

La chiave (token) sta solo nel Comando Rapido sull'iPhone. Non va mai scritta in questo repository.

---

## Parte 1 — Creare la chiave su GitHub (una volta l'anno)

1. Su github.com tocca la tua foto in alto a destra, poi **Settings**.
2. In fondo al menu a sinistra: **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
3. Compila così:
   - **Token name:** `Comando Rapido Risparmia Pieno`
   - **Expiration:** *Custom*, una data fra un anno. GitHub ti avvisa per email qualche giorno prima della scadenza.
   - **Repository access:** *Only select repositories* → `risparmia-pieno`
   - **Permissions → Repository permissions:**
     - **Actions:** *Read and write*
     - **Contents:** *Read and write*
     - lascia tutto il resto com'è (*Metadata: Read-only* si imposta da solo)
4. **Generate token** e **copia** la chiave, che inizia con `github_pat_`. GitHub la mostra una volta sola.

Con questa chiave si può modificare solo questo progetto, non gli altri. Se perdi l'iPhone, eliminala dalla stessa pagina e il Comando Rapido smette di funzionare.

---

## Parte 2 — Creare il Comando Rapido

Apri **Comandi Rapidi** → scheda **Comandi rapidi** → **+** in alto a destra. Chiamalo **Consegna prezzi carburante**.

Aggiungi le azioni in quest'ordine. Per trovarle, usa il campo di ricerca in basso. I nomi possono variare leggermente con la versione di iOS.

**Solo con il Wi-Fi**
1. **Ottieni dettagli della rete** → scegli *Wi-Fi* e *Nome rete*.
2. **Se** → *Dettagli della rete* → *non ha alcun valore*.
3. Dentro il "Se": **Interrompi questo comando rapido**. Il blocco "Altrimenti" lascialo vuoto.

**Scarica l'anagrafica**

4. **URL** → `https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv`
5. **Ottieni contenuti dell'URL** (metodo *GET*, già impostato).
6. **Imposta nome** → nome: `anagrafica_impianti_attivi.csv`
7. **Aggiungi a variabile** → nome variabile: `File`

**Scarica i prezzi**

8. **URL** → `https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv`
9. **Ottieni contenuti dell'URL**
10. **Imposta nome** → nome: `prezzo_alle_8.csv`
11. **Aggiungi a variabile** → `File`

**Crea lo zip**

12. **Crea archivio** → contenuto: variabile *File*, formato *.zip*, nome `mimit`.
13. **Data** → *Data attuale*.
14. **Formatta data** → formato *Personalizzato*: `yyyyMMdd-HHmm`

**Consegna a GitHub**

15. **Ottieni contenuti dell'URL**, toccando *Mostra altro*:
    - URL: `https://uploads.github.com/repos/FLYMAN-ONE/risparmia-pieno/releases/450208372/assets?name=mimit-`**[Data formattata]**`.zip`
      (inserisci la variabile *Data formattata* al posto giusto, senza spazi)
    - Metodo: **POST**
    - Intestazioni:
      - `Authorization` → `Bearer ` seguito dalla chiave copiata (es. `Bearer github_pat_…`)
      - `Accept` → `application/vnd.github+json`
      - `Content-Type` → `application/zip`
    - Corpo richiesta: **File** → variabile *Archivio*
16. **Ottieni contenuti dell'URL**, toccando *Mostra altro*:
    - URL: `https://api.github.com/repos/FLYMAN-ONE/risparmia-pieno/actions/workflows/ricevi-dati.yml/dispatches`
    - Metodo: **POST**
    - Intestazioni: `Authorization` (uguale a sopra) e `Accept` → `application/vnd.github+json`
    - Corpo richiesta: **JSON** → aggiungi un campo *Testo* con chiave `ref` e valore `main`

**Prova:** tocca ▶︎ con l'iPhone collegato al Wi-Fi. In 10-15 secondi deve finire senza errori. Poi controlla su GitHub, scheda **Actions**: deve comparire "Ricevi dati MIMIT" con la spunta verde.

---

## Parte 3 — Farlo partire da solo ogni giorno

Comandi Rapidi → scheda **Automazione** → **+** → **Ora del giorno**:
- **09:30**, *Ogni giorno*
- scegli **Esegui immediatamente** e disattiva *Notifica quando eseguito*
- azione: **Consegna prezzi carburante**

Crea una seconda automazione identica alle **19:30**: se la mattina eri fuori casa senza Wi-Fi, si recupera la sera. Se i dati sono già arrivati, la seconda consegna è un doppione innocuo.

I file del Ministero escono verso le 8:50 e contengono i prezzi delle 8 del giorno prima.

---

## Cosa fare se…

- **…su GitHub non compare la spunta verde da più di un giorno:** apri Comandi Rapidi e avvia a mano *Consegna prezzi carburante*. Se dà errore, leggi il messaggio:
  - *401* o *Bad credentials*: la chiave è scaduta o sbagliata. Rifai la Parte 1 e sostituiscila nelle azioni 15 e 16.
  - *422*: esiste già una consegna con lo stesso nome (due prove nello stesso minuto). Aspetta un minuto e riprova.
  - errore sull'indirizzo mimit.gov.it: il sito del Ministero è giù. Si riprova la sera.
- **…l'azione su GitHub è rossa:** il Ministero potrebbe aver cambiato il formato dei file. Vedi `FORMATO-MIMIT.md`.
- **…cambi iPhone:** il Comando Rapido si sincronizza con iCloud, ma le automazioni vanno ricreate (Parte 3).
