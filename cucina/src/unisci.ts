// Unione dell'anagrafica con i prezzi: ogni distributore riceve i suoi prezzi.
import type { Categoria } from '../../condiviso/carburanti.ts';
import { classificaCarburante } from './carburanti.ts';
import type { Impianto, Letto, Prezzo } from './leggi.ts';

/** Un prezzo con la categoria del carburante; `carburante` resta il nome originale del gestore. */
export interface PrezzoClassificato extends Omit<Prezzo, 'idImpianto'> {
  categoria: Categoria;
  premium: boolean;
}

export interface Distributore extends Impianto {
  prezzi: PrezzoClassificato[];
}

export interface Unione {
  dataEstrazione: string;
  /** solo i distributori con almeno un prezzo */
  distributori: Distributore[];
  /** distributori in anagrafica senza nessun prezzo (esclusi) */
  senzaPrezzi: number;
  /** prezzi di distributori che non sono in anagrafica (esclusi) */
  prezziOrfani: number;
  /** nomi di carburante non in tabella, con il numero di prezzi: da controllare */
  carburantiSconosciuti: Record<string, number>;
}

export function unisci(anagrafica: Letto<Impianto>, prezzi: Letto<Prezzo>): Unione {
  if (anagrafica.dataEstrazione !== prezzi.dataEstrazione) {
    throw new Error(
      `I due file sono di giorni diversi: anagrafica ${anagrafica.dataEstrazione}, prezzi ${prezzi.dataEstrazione}`,
    );
  }

  const perImpianto = new Map<number, PrezzoClassificato[]>();
  const carburantiSconosciuti: Record<string, number> = {};
  for (const { idImpianto, ...dati } of prezzi.righe) {
    const { categoria, premium, sconosciuto } = classificaCarburante(dati.carburante);
    if (sconosciuto) {
      carburantiSconosciuti[dati.carburante] = (carburantiSconosciuti[dati.carburante] ?? 0) + 1;
    }
    const prezzo: PrezzoClassificato = { ...dati, categoria, premium };
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

  return {
    dataEstrazione: anagrafica.dataEstrazione,
    distributori,
    senzaPrezzi,
    prezziOrfani,
    carburantiSconosciuti,
  };
}
