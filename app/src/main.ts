// Avvio dell'app: mostra subito la schermata, poi carica i prezzi.
import './stile/font.css';
import './stile/token.css';
import './stile/base.css';
import './stile/struttura.css';
import './stile/lista.css';
import './stile/filtri.css';
import { caricaPrezzi } from './dati/carica.ts';
import { testoDataPrezzi } from './dati/data.ts';
import { icona, type NomeIcona } from './icone/icone.ts';
import { cambioDa, disegnaFiltri, disegnaRaggio, disegnaScelte, eUnFiltro, raggioDaPosizione, raggioDaTesto } from './impostazioni/filtri.ts';
import { apriMenu, chiudiMenu, menuAperto, preparaMenu } from './interfaccia/menu.ts';
import { cambiaCarburante, filtriDa, leggiPreferenze, salvaPreferenze, type Filtri, type Preferenze } from './impostazioni/preferenze.ts';
import { RAGGI_KM, type RaggioKm } from './vicini/vicini.ts';
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
const zonaRaggio = document.querySelector<HTMLElement>('[data-raggio]')!;

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
  zonaRaggio.hidden = !attuali;
  zonaFiltri.innerHTML = attuali ? disegnaFiltri(attuali) : '';
  zonaRaggio.innerHTML = attuali ? disegnaRaggio(attuali.raggioKm) : '';
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

// Tocco su una pillola: si apre (o si chiude) il menu sotto di lei
zonaFiltri.addEventListener('click', (evento) => {
  const pillola = (evento.target as Element).closest<HTMLElement>('[data-apri-filtro]');
  const nome = pillola?.dataset['apriFiltro'];
  const attuali = filtri();
  if (!pillola || !eUnFiltro(nome) || !attuali) return;
  if (menuAperto() === pillola) {
    chiudiMenu();
    return;
  }
  apriMenu(pillola, disegnaScelte(nome, attuali), scegliFiltro);
});

/** Tocco su una scelta del menu: la lista si aggiorna e il menu si chiude. */
function scegliFiltro(bersaglio: Element): void {
  const scelta = bersaglio.closest<HTMLElement>('[data-filtro]');
  const cambio = cambioDa(scelta?.dataset['filtro'], scelta?.dataset['valore']);
  if (!cambio) return;
  chiudiMenu();
  preferenze =
    cambio.filtro === 'carburante'
      ? cambiaCarburante(preferenze, cambio.valore) // self/servito torna quello adatto al nuovo carburante
      : { ...preferenze, [cambio.filtro]: cambio.valore };
  salvaPreferenze(preferenze);
  disegnaBarraFiltri();
  mostraRisultati(true);
  // il fuoco torna sulla pillola (è un bottone: non riapre nulla), utile con tastiera e VoiceOver
  zonaFiltri.querySelector<HTMLElement>(`[data-apri-filtro="${cambio.filtro}"]`)?.focus({ preventScroll: true });
}

// ——— Slider del raggio ———
function cambiaRaggio(raggioKm: RaggioKm | undefined): void {
  if (!raggioKm || raggioKm === filtri()?.raggioKm) return;
  preferenze = { ...preferenze, raggioKm };
  salvaPreferenze(preferenze);
  // si aggiornano solo testi e tacche: lo slider resta lo stesso, così il dito non lo perde
  const slider = zonaRaggio.querySelector<HTMLInputElement>('[data-slider-raggio]');
  slider?.setAttribute('aria-valuetext', `${String(raggioKm)} km`);
  for (const tacca of zonaRaggio.querySelectorAll<HTMLElement>('[data-raggio-km]')) {
    tacca.toggleAttribute('data-scelta', tacca.dataset['raggioKm'] === String(raggioKm));
  }
  mostraRisultati(true);
}

zonaRaggio.addEventListener('input', (evento) => {
  cambiaRaggio(raggioDaPosizione((evento.target as HTMLInputElement).value));
});
zonaRaggio.addEventListener('click', (evento) => {
  const tacca = (evento.target as Element).closest<HTMLElement>('[data-raggio-km]');
  const raggioKm = raggioDaTesto(tacca?.dataset['raggioKm']);
  if (!tacca || !raggioKm) return;
  const slider = zonaRaggio.querySelector<HTMLInputElement>('[data-slider-raggio]');
  if (slider) slider.value = String(RAGGI_KM.indexOf(raggioKm));
  cambiaRaggio(raggioKm);
});

disegnaIcone();
preparaMenu();
disegnaBarraFiltri();
coloreBarraDiStato();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', coloreBarraDiStato);
if (!preferenze.carburante) mostraPartenza();
void avvia();
