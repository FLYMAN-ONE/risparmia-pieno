// Avvio dell'app: mostra subito la schermata, poi carica i prezzi.
import './stile/font.css';
import './stile/token.css';
import './stile/base.css';
import './stile/struttura.css';
import { caricaPrezzi } from './dati/carica.ts';
import { testoDataPrezzi } from './dati/data.ts';
import { icona, type NomeIcona } from './icone/icone.ts';
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
  contenuto.replaceChildren(invito);
}

disegnaIcone();
coloreBarraDiStato();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', coloreBarraDiStato);
void avvia();

// Per ora serve solo a non perdere i dati caricati: li useranno "Intorno a me" e la lista.
export const datiCaricati = (): DatiPrezzi | undefined => dati;
