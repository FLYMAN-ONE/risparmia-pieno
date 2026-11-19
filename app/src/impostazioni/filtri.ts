// Filtri nella barra in alto (passo 2, layout A): carburante, self/servito, raggio.
// Ogni filtro è una pillola; toccandola sale dal basso il pannello con le scelte.
import { NOME_CATEGORIA } from '../../../condiviso/carburanti.ts';
import { icona } from '../icone/icone.ts';
import type { Modalita } from '../lista/lista.ts';
import { RAGGI_KM, type RaggioKm } from '../vicini/vicini.ts';
import { CARBURANTI_SCELTI, MODALITA, type CarburanteScelto, type Filtri } from './preferenze.ts';

export type NomeFiltro = keyof Filtri;

const NOME_MODALITA: Record<Modalita, string> = { self: 'Self', servito: 'Servito', tutte: 'Self e servito' };

interface Opzione {
  valore: string;
  testo: string;
  nota?: string;
}

/** Titolo del pannello e voci di ogni filtro. */
export const FILTRI: Record<NomeFiltro, { titolo: string; opzioni: Opzione[] }> = {
  carburante: {
    titolo: 'Carburante',
    opzioni: CARBURANTI_SCELTI.map((c) => ({ valore: c, testo: NOME_CATEGORIA[c] })),
  },
  modalita: {
    titolo: 'Self o servito',
    opzioni: MODALITA.map((m) => ({
      valore: m,
      testo: NOME_MODALITA[m],
      ...(m === 'tutte' ? { nota: 'Il prezzo più basso tra i due' } : {}),
    })),
  },
  raggioKm: {
    titolo: 'Raggio',
    opzioni: RAGGI_KM.map((r) => ({ valore: String(r), testo: `${String(r)} km` })),
  },
};

const ORDINE: NomeFiltro[] = ['carburante', 'modalita', 'raggioKm'];

function testoScelto(nome: NomeFiltro, filtri: Filtri): string {
  return FILTRI[nome].opzioni.find((o) => o.valore === String(filtri[nome]))?.testo ?? '';
}

/** Le tre pillole. Il nome del filtro è letto da VoiceOver e TalkBack prima della scelta. */
export function disegnaFiltri(filtri: Filtri): string {
  return ORDINE.map(
    (nome) => `<button type="button" class="filtro" data-apri-filtro="${nome}" aria-haspopup="dialog">
      <span class="solo-lettori">${FILTRI[nome].titolo}: </span><span class="valore">${testoScelto(nome, filtri)}</span>${icona('scegli')}
    </button>`,
  ).join('');
}

/** Il contenuto del pannello: una riga grande per ogni scelta, con l'indicatore su quella attuale. */
export function disegnaScelte(nome: NomeFiltro, filtri: Filtri): string {
  const attuale = String(filtri[nome]);
  return `<div class="scelte-pannello" role="radiogroup" aria-labelledby="titolo-pannello">${FILTRI[nome].opzioni
    .map(
      ({ valore, testo, nota }) => `<button type="button" role="radio" class="scelta" data-filtro="${nome}" data-valore="${valore}"
        aria-checked="${String(valore === attuale)}">
        <span class="testo">${testo}${nota ? `<span class="nota">${nota}</span>` : ''}</span>
        <span class="indicatore" aria-hidden="true"></span>
      </button>`,
    )
    .join('')}</div>`;
}

/** Il filtro cambiato, già controllato: solo valori previsti. */
export type Cambio =
  | { filtro: 'carburante'; valore: CarburanteScelto }
  | { filtro: 'modalita'; valore: Modalita }
  | { filtro: 'raggioKm'; valore: RaggioKm };

export function cambioDa(filtro: string | undefined, valore: string | undefined): Cambio | undefined {
  switch (filtro) {
    case 'carburante': {
      const v = CARBURANTI_SCELTI.find((c) => c === valore);
      return v && { filtro, valore: v };
    }
    case 'modalita': {
      const v = MODALITA.find((m) => m === valore);
      return v && { filtro, valore: v };
    }
    case 'raggioKm': {
      const v = RAGGI_KM.find((r) => String(r) === valore);
      return v && { filtro, valore: v };
    }
    default:
      return undefined;
  }
}

export function eUnFiltro(nome: string | undefined): nome is NomeFiltro {
  return ORDINE.includes(nome as NomeFiltro);
}
