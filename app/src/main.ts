// Avvio dell'app: mostra subito la schermata, poi carica i prezzi.
import './stile/font.css';
import './stile/token.css';
import './stile/base.css';
import './stile/struttura.css';
import { caricaPrezzi } from './dati/carica.ts';
import { testoDataPrezzi } from './dati/data.ts';
import { icona, type NomeIcona } from './icone/icone.ts';
import { chiediPosizione, type Posizione } from './posizione/posizione.ts';
import type { DatiPrezzi } from '../../condiviso/formato.ts';

const html = document.documentElement;
const dataPrezzi = document.querySelector<HTMLElement>('[data-data-prezzi]')!;
const contenuto = document.querySelector<HTMLElement>('[data-contenuto]')!;
/** Il testo di partenza, da rimettere quando i prezzi arrivano dopo un errore. */
const invito = contenuto.querySelector<HTMLElement>('.invito')!;

/** I prezzi caricati: restano solo in memoria finché l'app è aperta. */
let dati: DatiPrezzi | undefined;

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

function mostraErrore(): void {
  dataPrezzi.textContent = 'Prezzi non disponibili';
  contenuto.innerHTML = `<div class="messaggio" role="alert">${icona('offline')}<div>
    <p>Prezzi non disponibili. Controlla la connessione e riprova.</p>
    <button type="button" class="bottone secondario" data-riprova>Riprova</button></div></div>`;
  contenuto.querySelector('[data-riprova]')!.addEventListener('click', () => void avvia());
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
  else contenuto.replaceChildren(invito);
}

// ——— Intorno a me ———
const bottoneIntorno = document.querySelector<HTMLButtonElement>('[data-intorno]')!;

/** La posizione: solo in questa variabile, finché l'app è aperta. Mai salvata. */
let posizione: Posizione | undefined;

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
}

/** Provvisorio: la lista dei distributori vicini arriva nei prossimi task. */
function mostraRisultati(): void {
  if (!posizione) return;
  if (!dati) {
    // la posizione è arrivata prima dei prezzi: si mostra tutto appena finisce il caricamento
    contenuto.innerHTML = '<p class="invito" role="status">Carico i prezzi…</p>';
    return;
  }
  contenuto.innerHTML = '<p class="invito" role="status">Posizione trovata. La lista dei distributori arriva nel prossimo passo.</p>';
}

bottoneIntorno.addEventListener('click', () => void intornoAMe());

disegnaIcone();
coloreBarraDiStato();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', coloreBarraDiStato);
void avvia();
