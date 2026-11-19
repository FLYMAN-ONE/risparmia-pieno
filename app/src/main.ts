// Avvio dell'app: mostra subito la schermata, poi carica i prezzi.
import './stile/font.css';
import './stile/token.css';
import './stile/base.css';
import './stile/struttura.css';
import './stile/lista.css';
import './stile/pannello.css';
import { caricaPrezzi } from './dati/carica.ts';
import { testoDataPrezzi } from './dati/data.ts';
import { icona, type NomeIcona } from './icone/icone.ts';
import { cambioDa, disegnaFiltri, disegnaScelte, eUnFiltro, FILTRI } from './impostazioni/filtri.ts';
import { apriPannello, chiudiPannello, preparaPannello } from './interfaccia/pannello.ts';
import { cambiaCarburante, filtriDa, leggiPreferenze, salvaPreferenze, type Filtri, type Preferenze } from './impostazioni/preferenze.ts';
import { carburanteToccato, disegnaSceltaCarburante } from './impostazioni/scelta-carburante.ts';
import { ordina, preparaLista, type Ordine } from './lista/lista.ts';
import { disegnaLista } from './lista/vista.ts';
import { chiediPosizione, type Posizione } from './posizione/posizione.ts';
import { entroRaggio } from './vicini/vicini.ts';
import type { DatiPrezzi } from '../../condiviso/formato.ts';

const html = document.documentElement;
const dataPrezzi = document.querySelector<HTMLElement>('[data-data-prezzi]')!;
const contenuto = document.querySelector<HTMLElement>('[data-contenuto]')!;
/** Il testo di partenza, da rimettere quando i prezzi arrivano dopo un errore. */
const invito = contenuto.querySelector<HTMLElement>('.invito')!;
const bottoneIntorno = document.querySelector<HTMLButtonElement>('[data-intorno]')!;
const zonaFiltri = document.querySelector<HTMLElement>('[data-filtri]')!;

// ——— Stato dell'app: tutto solo in memoria, tranne le preferenze ———
/** I prezzi caricati */
let dati: DatiPrezzi | undefined;
/** La posizione: solo in questa variabile, finché l'app è aperta. Mai salvata. */
let posizione: Posizione | undefined;
/** Le scelte dell'utente (salvate sul telefono, senza la posizione) */
let preferenze: Preferenze = leggiPreferenze();
let ordine: Ordine = 'prezzo';

/** I filtri in uso, se il carburante è già stato scelto. */
function filtri(): Filtri | undefined {
  const { carburante } = preferenze;
  return carburante ? filtriDa({ ...preferenze, carburante }) : undefined;
}

/** I filtri compaiono in alto dopo la scelta del carburante. */
function disegnaBarraFiltri(): void {
  const attuali = filtri();
  zonaFiltri.hidden = !attuali;
  zonaFiltri.innerHTML = attuali ? disegnaFiltri(attuali) : '';
}

function disegnaIcone(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-icona]')) {
    el.innerHTML = icona(el.dataset['icona'] as NomeIcona);
  }
}

/** Il colore della barra di stato del telefono segue lo sfondo del tema. */
function coloreBarraDiStato(): void {
  const colore = getComputedStyle(html).getPropertyValue('--superficie').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colore);
}

/** Cosa mostrare quando non c'è (ancora) una lista: la domanda del primo uso o l'invito. */
function mostraPartenza(): void {
  if (!preferenze.carburante) contenuto.innerHTML = disegnaSceltaCarburante();
  else contenuto.replaceChildren(invito);
}

function mostraErrore(): void {
  dataPrezzi.textContent = 'Prezzi non disponibili';
  contenuto.innerHTML = `<div class="messaggio" role="alert">${icona('offline')}<div>
    <p>Prezzi non disponibili. Controlla la connessione e riprova.</p>
    <button type="button" class="bottone secondario" data-riprova>Riprova</button></div></div>`;
}

async function avvia(): Promise<void> {
  dataPrezzi.textContent = 'Carico i prezzi…';
  const esito = await caricaPrezzi();
  if (esito.tipo === 'errore') {
    mostraErrore();
    return;
  }
  dati = esito.dati;
  dataPrezzi.textContent = testoDataPrezzi(dati.dataEstrazione);
  if (posizione) mostraRisultati();
  else mostraPartenza();
}

// ——— Intorno a me ———
function mostraPosizioneNonDisponibile(): void {
  // Testo deciso al passo 11. Il bottone "Cerca un comune" arriva con la ricerca (fase 6).
  contenuto.innerHTML = `<div class="messaggio" role="alert">${icona('intornoAMe')}<div>
    <p>Posizione non disponibile. Cerca un comune oppure attiva la posizione nelle impostazioni.</p></div></div>`;
}

async function intornoAMe(): Promise<void> {
  if (bottoneIntorno.getAttribute('aria-busy') === 'true') return; // ignora i tocchi doppi
  bottoneIntorno.setAttribute('aria-busy', 'true');
  contenuto.innerHTML = '<p class="invito" role="status">Cerco la tua posizione…</p>';

  const esito = await chiediPosizione();
  bottoneIntorno.removeAttribute('aria-busy');
  if (esito.tipo !== 'ok') {
    posizione = undefined;
    mostraPosizioneNonDisponibile();
    return;
  }
  posizione = esito.posizione;
  mostraRisultati();
  // lieve vibrazione: risultati pronti (passo 9). Solo Android; il telefono la permette solo subito dopo un tocco.
  if (dati && preferenze.carburante && navigator.userActivation?.isActive) navigator.vibrate?.(10);
}

function mostraRisultati(sfuma = false): void {
  if (!posizione) return;
  if (!dati) {
    // la posizione è arrivata prima dei prezzi: si mostra tutto appena finisce il caricamento
    contenuto.innerHTML = '<p class="invito" role="status">Carico i prezzi…</p>';
    return;
  }
  const attuali = filtri();
  if (!attuali) {
    // primo uso: prima la domanda, poi la lista compare da sola
    contenuto.innerHTML = disegnaSceltaCarburante();
    return;
  }
  const { carburante, modalita, raggioKm } = attuali;
  const lista = preparaLista(entroRaggio(dati.distributori, posizione, raggioKm), carburante, modalita);
  contenuto.innerHTML = disegnaLista(lista, { carburante, raggioKm, ordine, voci: ordina(lista.voci, ordine) });
  if (sfuma) contenuto.querySelector('.righe')?.classList.add('aggiornata');
}

// ——— Tocchi ———
bottoneIntorno.addEventListener('click', () => void intornoAMe());

contenuto.addEventListener('click', (evento) => {
  const bersaglio = evento.target as Element;
  if (bersaglio.closest('[data-riprova]')) {
    void avvia();
    return;
  }
  if (bersaglio.closest('[data-ordina]')) {
    ordine = ordine === 'prezzo' ? 'distanza' : 'prezzo';
    mostraRisultati(true);
    contenuto.querySelector<HTMLElement>('[data-ordina]')?.focus();
    return;
  }
  const carburante = carburanteToccato(evento);
  if (carburante) {
    preferenze = cambiaCarburante(preferenze, carburante);
    salvaPreferenze(preferenze);
    disegnaBarraFiltri();
    if (posizione) mostraRisultati();
    else contenuto.replaceChildren(invito);
  }
});

// Tocco su una pillola: sale il pannello con le scelte di quel filtro
zonaFiltri.addEventListener('click', (evento) => {
  const pillola = (evento.target as Element).closest<HTMLElement>('[data-apri-filtro]');
  const nome = pillola?.dataset['apriFiltro'];
  const attuali = filtri();
  if (!pillola || !eUnFiltro(nome) || !attuali) return;
  pillola.setAttribute('aria-expanded', 'true');
  apriPannello({
    titolo: FILTRI[nome].titolo,
    corpo: disegnaScelte(nome, attuali),
    alTocco: scegliFiltro,
    allaChiusura: () => {
      // il fuoco torna sulla pillola (un bottone: non si riapre nulla)
      const nuova = zonaFiltri.querySelector<HTMLElement>(`[data-apri-filtro="${nome}"]`);
      nuova?.removeAttribute('aria-expanded');
      nuova?.focus({ preventScroll: true });
    },
  });
});

/** Tocco su una scelta nel pannello: si segna subito, la lista si aggiorna, il pannello scende. */
function scegliFiltro(bersaglio: Element): void {
  const scelta = bersaglio.closest<HTMLElement>('[data-filtro]');
  const cambio = cambioDa(scelta?.dataset['filtro'], scelta?.dataset['valore']);
  if (!scelta || !cambio) return;
  for (const altra of scelta.parentElement!.querySelectorAll('[aria-checked]')) {
    altra.setAttribute('aria-checked', String(altra === scelta));
  }
  preferenze =
    cambio.filtro === 'carburante'
      ? cambiaCarburante(preferenze, cambio.valore) // self/servito torna quello adatto al nuovo carburante
      : { ...preferenze, [cambio.filtro]: cambio.valore };
  salvaPreferenze(preferenze);
  disegnaBarraFiltri();
  mostraRisultati(true);
  // una brevissima pausa per vedere la scelta segnata, poi il pannello scende
  window.setTimeout(chiudiPannello, 120);
}

disegnaIcone();
preparaPannello();
disegnaBarraFiltri();
coloreBarraDiStato();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', coloreBarraDiStato);
if (!preferenze.carburante) mostraPartenza();
void avvia();
