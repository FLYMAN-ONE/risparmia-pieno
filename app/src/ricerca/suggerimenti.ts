// I suggerimenti sotto il campo "Cerca un comune": un bottone per comune, con la provincia.
import type { Comune } from '../../../condiviso/formato.ts';
import { icona } from '../icone/icone.ts';
import { esc, inCaratteriNormali } from '../lista/testo.ts';

/** "GALLARATE" → "Gallarate" */
export function nomeComune(comune: Comune): string {
  return inCaratteriNormali(comune.nome);
}

/** trovati: comuni con la loro posizione nell'elenco completo (serve per sceglierli) */
export function disegnaSuggerimenti(testo: string, trovati: readonly { comune: Comune; indice: number }[]): string {
  if (testo.trim().length < 2) return '<p class="invito" role="status">Scrivi il nome di un comune.</p>';
  if (!trovati.length) return `<p class="invito" role="status">Nessun comune trovato.</p>`;
  return `<ul class="suggerimenti" aria-label="Comuni trovati">${trovati
    .map(
      ({ comune, indice }) => `<li><button type="button" class="suggerimento" data-comune="${String(indice)}">
        ${icona('intornoAMe')}<span class="nome">${esc(nomeComune(comune))}</span><span class="provincia">${esc(comune.provincia)}</span>
      </button></li>`,
    )
    .join('')}</ul>`;
}
