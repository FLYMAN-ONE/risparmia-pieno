// Dalla lista dei vicini alla lista dei prezzi: un prezzo per distributore, la media della zona,
// il colore di ogni prezzo e il più conveniente. I conti si fanno in millesimi di euro (numeri interi),
// così non ci sono errori di arrotondamento sui centesimi.
import type { Categoria } from '../../../condiviso/carburanti.ts';
import type { DistributoreApp } from '../../../condiviso/formato.ts';
import type { Vicino } from '../vicini/vicini.ts';

export type Modalita = 'self' | 'servito' | 'tutte';

/** GPL e metano sono quasi sempre "servito": per loro si guardano tutti i prezzi. */
export function modalitaPredefinita(carburante: Categoria): Modalita {
  return carburante === 'gpl' || carburante === 'metano' ? 'tutte' : 'self';
}

/** Passo 4: conveniente o caro se almeno 1 centesimo (10 millesimi) sotto o sopra la media locale. */
const SOGLIA_MILLESIMI = 10;

export type Fascia = 'conveniente' | 'media' | 'caro';

export interface Voce {
  distributore: DistributoreApp;
  km: number;
  euro: number;
  self: boolean;
  /** prezzo non aggiornato dal gestore da oltre 7 giorni */
  vecchio: boolean;
  /** giorno della comunicazione del gestore, "2026-11-09" */
  comunicato: string;
  fascia: Fascia;
}

export interface Lista {
  /** tutte le voci, dal prezzo più basso (a parità di prezzo, dal più vicino) */
  voci: Voce[];
  /** il più conveniente: prezzo più basso tra quelli aggiornati */
  migliore: Voce | undefined;
  /** media locale in euro */
  media: number;
}

const millesimi = (euro: number) => Math.round(euro * 1000);

/** Il prezzo da mostrare per un distributore: il più basso del carburante e della modalità scelti, premium esclusi. */
function prezzoDi(distributore: DistributoreApp, carburante: Categoria, modalita: Modalita) {
  let scelto: DistributoreApp['prezzi'][number] | undefined;
  for (const prezzo of distributore.prezzi) {
    if (prezzo.categoria !== carburante || prezzo.premium) continue;
    if (modalita === 'self' && !prezzo.self) continue;
    if (modalita === 'servito' && prezzo.self) continue;
    const migliore =
      !scelto ||
      millesimi(prezzo.euro) < millesimi(scelto.euro) ||
      (millesimi(prezzo.euro) === millesimi(scelto.euro) && scelto.vecchio && !prezzo.vecchio);
    if (migliore) scelto = prezzo;
  }
  return scelto;
}

export function preparaLista(
  vicini: readonly Vicino<DistributoreApp>[],
  carburante: Categoria,
  modalita: Modalita,
): Lista {
  const conPrezzo = vicini.flatMap(({ distributore, km }) => {
    const prezzo = prezzoDi(distributore, carburante, modalita);
    return prezzo ? [{ distributore, km, prezzo }] : [];
  });
  if (conPrezzo.length === 0) return { voci: [], migliore: undefined, media: 0 };

  const mediaMillesimi = conPrezzo.reduce((somma, v) => somma + millesimi(v.prezzo.euro), 0) / conPrezzo.length;
  const fasciaDi = (euro: number): Fascia => {
    const m = millesimi(euro);
    if (m <= mediaMillesimi - SOGLIA_MILLESIMI) return 'conveniente';
    if (m >= mediaMillesimi + SOGLIA_MILLESIMI) return 'caro';
    return 'media';
  };

  const voci = ordina(
    conPrezzo.map(({ distributore, km, prezzo }): Voce => ({
      distributore,
      km,
      euro: prezzo.euro,
      self: prezzo.self,
      vecchio: prezzo.vecchio,
      comunicato: prezzo.comunicato,
      fascia: fasciaDi(prezzo.euro),
    })),
    'prezzo',
  );
  // Il più conveniente deve essere affidabile: si sceglie tra i prezzi aggiornati, se ce ne sono
  const migliore = voci.find((v) => !v.vecchio) ?? voci[0];
  return { voci, migliore, media: mediaMillesimi / 1000 };
}

export type Ordine = 'prezzo' | 'distanza';

export function ordina(voci: readonly Voce[], per: Ordine): Voce[] {
  return [...voci].sort((a, b) =>
    per === 'prezzo' ? millesimi(a.euro) - millesimi(b.euro) || a.km - b.km : a.km - b.km || millesimi(a.euro) - millesimi(b.euro),
  );
}
