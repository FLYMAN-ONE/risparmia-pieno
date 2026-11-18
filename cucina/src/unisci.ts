// Unione dell'anagrafica con i prezzi: ogni distributore riceve i suoi prezzi.
import type { Impianto, Letto, Prezzo } from './leggi.ts';

export interface Distributore extends Impianto {
  prezzi: Omit<Prezzo, 'idImpianto'>[];
}

export interface Unione {
  dataEstrazione: string;
  /** solo i distributori con almeno un prezzo */
  distributori: Distributore[];
  /** distributori in anagrafica senza nessun prezzo (esclusi) */
  senzaPrezzi: number;
  /** prezzi di distributori che non sono in anagrafica (esclusi) */
  prezziOrfani: number;
}

export function unisci(anagrafica: Letto<Impianto>, prezzi: Letto<Prezzo>): Unione {
  if (anagrafica.dataEstrazione !== prezzi.dataEstrazione) {
    throw new Error(
      `I due file sono di giorni diversi: anagrafica ${anagrafica.dataEstrazione}, prezzi ${prezzi.dataEstrazione}`,
    );
  }

  const perImpianto = new Map<number, Distributore['prezzi']>();
  for (const { idImpianto, ...prezzo } of prezzi.righe) {
    const lista = perImpianto.get(idImpianto);
    if (lista) lista.push(prezzo);
    else perImpianto.set(idImpianto, [prezzo]);
  }

  const distributori: Distributore[] = [];
  let senzaPrezzi = 0;
  const idUsati = new Set<number>();
  for (const impianto of anagrafica.righe) {
    const suoiPrezzi = perImpianto.get(impianto.id);
    if (!suoiPrezzi) {
      senzaPrezzi++;
      continue;
    }
    idUsati.add(impianto.id);
    distributori.push({ ...impianto, prezzi: suoiPrezzi });
  }

  let prezziOrfani = 0;
  for (const [id, lista] of perImpianto) {
    if (!idUsati.has(id)) prezziOrfani += lista.length;
  }

  return { dataEstrazione: anagrafica.dataEstrazione, distributori, senzaPrezzi, prezziOrfani };
}
