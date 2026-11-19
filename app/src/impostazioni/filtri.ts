// Filtri nella barra in alto (passo 2, layout A): carburante, self/servito, raggio.
// Sono selettori nativi: sul telefono si apre la rotella (iPhone) o il menu (Android).
import { NOME_CATEGORIA } from '../../../condiviso/carburanti.ts';
import { icona } from '../icone/icone.ts';
import type { Modalita } from '../lista/lista.ts';
import { RAGGI_KM, type RaggioKm } from '../vicini/vicini.ts';
import { CARBURANTI_SCELTI, MODALITA, type CarburanteScelto, type Filtri } from './preferenze.ts';

const NOME_MODALITA: Record<Modalita, string> = { self: 'Self', servito: 'Servito', tutte: 'Self e servito' };

function selettore(nome: string, etichetta: string, opzioni: [string, string][], scelto: string): string {
  // La pillola mostra la scelta attuale ed è larga quanto lei; il selettore vero, invisibile,
  // le sta sopra e riceve il tocco (così la pillola non si allarga alla voce più lunga).
  const testoScelto = opzioni.find(([valore]) => valore === scelto)?.[1] ?? '';
  return `<label class="filtro">
    <span class="solo-lettori">${etichetta}</span>
    <span class="valore" aria-hidden="true">${testoScelto}</span>
    <select data-filtro="${nome}">${opzioni
      .map(([valore, testo]) => `<option value="${valore}"${valore === scelto ? ' selected' : ''}>${testo}</option>`)
      .join('')}</select>
    ${icona('scegli')}
  </label>`;
}

export function disegnaFiltri(filtri: Filtri): string {
  return [
    selettore('carburante', 'Carburante', CARBURANTI_SCELTI.map((c) => [c, NOME_CATEGORIA[c]]), filtri.carburante),
    selettore('modalita', 'Self o servito', MODALITA.map((m) => [m, NOME_MODALITA[m]]), filtri.modalita),
    selettore('raggioKm', 'Raggio', RAGGI_KM.map((r) => [String(r), `${String(r)} km`]), String(filtri.raggioKm)),
  ].join('');
}

/** Il filtro cambiato, già controllato: solo valori previsti. */
export type Cambio =
  | { filtro: 'carburante'; valore: CarburanteScelto }
  | { filtro: 'modalita'; valore: Modalita }
  | { filtro: 'raggioKm'; valore: RaggioKm };

export function cambioDa(select: HTMLSelectElement): Cambio | undefined {
  const { value } = select;
  switch (select.dataset['filtro']) {
    case 'carburante': {
      const valore = CARBURANTI_SCELTI.find((c) => c === value);
      return valore && { filtro: 'carburante', valore };
    }
    case 'modalita': {
      const valore = MODALITA.find((m) => m === value);
      return valore && { filtro: 'modalita', valore };
    }
    case 'raggioKm': {
      const valore = RAGGI_KM.find((r) => String(r) === value);
      return valore && { filtro: 'raggioKm', valore };
    }
    default:
      return undefined;
  }
}
