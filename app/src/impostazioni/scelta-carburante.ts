// Domanda al primo uso: "Che carburante usi?" (decisione del 19/11/2026).
import { NOME_CATEGORIA } from '../../../condiviso/carburanti.ts';
import { CARBURANTI_SCELTI, type CarburanteScelto } from './preferenze.ts';

export function disegnaSceltaCarburante(): string {
  return `<section class="scelta-carburante" aria-labelledby="domanda-carburante">
    <h2 id="domanda-carburante">Che carburante usi?</h2>
    <div class="scelte">${CARBURANTI_SCELTI.map(
      (c) => `<button type="button" class="bottone secondario" data-carburante="${c}">${NOME_CATEGORIA[c]}</button>`,
    ).join('')}</div>
  </section>`;
}

/** Il carburante del bottone toccato, se il tocco era su uno dei bottoni della scelta. */
export function carburanteToccato(evento: Event): CarburanteScelto | undefined {
  const bottone = (evento.target as Element | null)?.closest<HTMLElement>('[data-carburante]');
  const valore = bottone?.dataset['carburante'];
  return CARBURANTI_SCELTI.find((c) => c === valore);
}
