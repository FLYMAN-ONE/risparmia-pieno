// Produce il file nazionale compatto (formato in condiviso/formato.ts).
import {
  SELF,
  VECCHIO,
  VERSIONE_FORMATO,
  type CarburanteCompatto,
  type ComuneCompatto,
  type DistributoreCompatto,
  type FilePrezzi,
} from '../../condiviso/formato.ts';
import type { DistributoreControllato } from './qualita.ts';

export const FONTE =
  'Ministero delle Imprese e del Made in Italy (MIMIT), Osservaprezzi Carburanti. Licenza IODL 2.0.';

const GIORNO_MS = 86_400_000;

/** Coordinate a 5 decimali: circa un metro di precisione, basta e avanza. */
function arrotonda(coordinata: number): number {
  return Math.round(coordinata * 100_000) / 100_000;
}

/** Restituisce la posizione di `chiave` nell'elenco, aggiungendola se manca. */
function dizionario<T>(): { indice: (chiave: string, valore: () => T) => number; valori: T[] } {
  const posizioni = new Map<string, number>();
  const valori: T[] = [];
  return {
    valori,
    indice(chiave, valore) {
      let pos = posizioni.get(chiave);
      if (pos === undefined) {
        pos = valori.length;
        valori.push(valore());
        posizioni.set(chiave, pos);
      }
      return pos;
    },
  };
}

export function generaFile(
  distributori: DistributoreControllato[],
  dataEstrazione: string,
  generato: Date,
): FilePrezzi {
  const carburanti = dizionario<CarburanteCompatto>();
  const bandiere = dizionario<string>();

  // Comuni: il centro è la media delle coordinate dei suoi distributori
  const sommeComuni = new Map<string, { nome: string; provincia: string; lat: number; lon: number; n: number }>();
  for (const d of distributori) {
    const chiave = `${d.comune}|${d.provincia}`;
    const s = sommeComuni.get(chiave) ?? { nome: d.comune, provincia: d.provincia, lat: 0, lon: 0, n: 0 };
    s.lat += d.lat;
    s.lon += d.lon;
    s.n++;
    sommeComuni.set(chiave, s);
  }
  const elencoComuni = [...sommeComuni.entries()].sort(([a], [b]) => a.localeCompare(b, 'it'));
  const posizioneComune = new Map(elencoComuni.map(([chiave], i) => [chiave, i]));
  const comuni: ComuneCompatto[] = elencoComuni.map(([, s]) => [
    s.nome,
    s.provincia,
    arrotonda(s.lat / s.n),
    arrotonda(s.lon / s.n),
  ]);

  const giornoEstrazione = Date.parse(`${dataEstrazione}T00:00:00Z`);
  const compatti: DistributoreCompatto[] = distributori.map((d) => [
    d.id,
    d.nome,
    bandiere.indice(d.bandiera, () => d.bandiera),
    d.indirizzo,
    posizioneComune.get(`${d.comune}|${d.provincia}`) as number,
    arrotonda(d.lat),
    arrotonda(d.lon),
    d.tipo === 'Autostradale' ? 1 : 0,
    d.prezzi.map((p) => {
      const giorno = Date.parse(`${p.comunicato.slice(0, 10)}T00:00:00Z`);
      return [
        carburanti.indice(p.carburante, () => [p.carburante, p.categoria, p.premium ? 1 : 0]),
        Math.round(p.euro * 1000),
        (p.self ? SELF : 0) | (p.vecchio ? VECCHIO : 0),
        Math.max(0, Math.round((giornoEstrazione - giorno) / GIORNO_MS)),
      ];
    }),
  ]);

  return {
    versione: VERSIONE_FORMATO,
    dataEstrazione,
    generato: generato.toISOString(),
    fonte: FONTE,
    carburanti: carburanti.valori,
    bandiere: bandiere.valori,
    comuni,
    distributori: compatti,
  };
}
