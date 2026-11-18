# Il Comando Rapido che consegna i dati

I server di GitHub non riescono a raggiungere il sito del Ministero (mimit.gov.it): la connessione scade, come verificato il 18/11/2026. Per questo ogni giorno **l'iPhone** scarica i due file MIMIT e li consegna a GitHub, che poi li controlla e li elabora.

```
iPhone                                      GitHub
1. scarica i 2 CSV dal Ministero
2. li mette in uno zip
3. carica lo zip nella release  ──────────► "dati-grezzi"
4. avvia l'azione               ──────────► "Ricevi dati MIMIT" (controlli, poi elaborazione)
```

Il Comando Rapido è già pronto nel file [`comando-rapido/Consegna dati MIMIT.shortcut`](comando-rapido/). La chiave (token) si incolla al momento dell'importazione e resta solo nel Comando Rapido: non va mai scritta in questo repository.

---

## Parte 1 — Creare la chiave su GitHub (una volta l'anno)

1. Apri https://github.com/settings/personal-access-tokens/new
2. Compila così:
   - **Token name:** `Comando Rapido Risparmia Pieno`
   - **Expiration:** *Custom*, una data fra un anno. GitHub ti avvisa per email prima della scadenza.
   - **Repository access:** *Only select repositories* → `risparmia-pieno`
   - **Permissions → Repository permissions:** **Actions** *Read and write*, **Contents** *Read and write*. Il resto lascialo com'è.
3. **Generate token** e **copia** la chiave, che inizia con `github_pat_`. GitHub la mostra una volta sola.

Con questa chiave si può modificare solo questo progetto. Se perdi l'iPhone, eliminala dalla stessa pagina di GitHub.

## Parte 2 — Importare il Comando Rapido

1. Sul Mac apri il file `cucina/comando-rapido/Consegna dati MIMIT.shortcut` con un doppio clic.
2. Clicca **Aggiungi comando rapido** e, quando lo chiede, **incolla la chiave**.
3. Il comando arriva da solo anche sull'iPhone tramite iCloud.

**Prova:** avvialo, dal Mac o dall'iPhone. Dopo 10-20 secondi compare "Consegna: {…}" con dentro `"name":"mimit-…zip"`. Su GitHub, scheda **Actions**, "Ricevi dati MIMIT" deve avere la spunta verde.

Il comando non controlla se c'è il Wi-Fi: se parte in 4G/5G usa circa 7,5 MB di traffico dati.

## Parte 3 — Farlo partire da solo ogni giorno (sull'iPhone)

Comandi Rapidi → scheda **Automazione** → **+** → **Ora del giorno**:
- **09:30**, *Ogni giorno*
- **Esegui immediatamente**, con *Notifica quando eseguito* disattivato
- azione: **Consegna dati MIMIT**

Crea una seconda automazione identica alle **19:30**, come riserva se la mattina qualcosa va storto.

I file del Ministero escono verso le 8:50 e contengono i prezzi delle 8 del giorno prima.

---

## Cosa fare se…

- **…su GitHub non compare la spunta verde da più di un giorno:** avvia a mano *Consegna dati MIMIT* e leggi cosa compare dopo "Consegna:".
  - `Bad credentials`: la chiave è scaduta o sbagliata. Rifai la Parte 1, elimina il Comando Rapido e reimportalo (Parte 2) con la chiave nuova.
  - `already_exists`: due consegne nello stesso minuto. Aspetta un minuto e riprova.
  - errore sull'indirizzo mimit.gov.it: il sito del Ministero non risponde. Si riprova alla consegna successiva.
- **…l'azione su GitHub è rossa:** il Ministero potrebbe aver cambiato il formato dei file. Vedi `FORMATO-MIMIT.md`.
- **…cambi iPhone:** il Comando Rapido torna con iCloud, ma le automazioni vanno ricreate (Parte 3).

## Per chi mantiene il progetto

Il file `.shortcut` si rigenera con `crea_comando.py`, che non contiene segreti:

```bash
python3 cucina/comando-rapido/crea_comando.py grezzo.shortcut
shortcuts sign --mode anyone -i grezzo.shortcut -o "cucina/comando-rapido/Consegna dati MIMIT.shortcut"
```
