// Formato del file nazionale dei prezzi: lo scrive la cucina, lo legge l'app.
//
// Per stare leggero il file usa elenchi al posto di oggetti con nomi di campo ripetuti,
// e dizionari per i testi che si ripetono (marchi, nomi dei carburanti, comuni).
// Se il formato cambia, si aumenta VERSIONE_FORMATO: l'app riconosce un file che non sa leggere.
import type { Categoria } from './carburanti.ts';

export const VERSIONE_FORMATO = 1;

/** Opzioni di un prezzo, sommate come bit. */
export const SELF = 1;
export const VECCHIO = 2;

/** [nome originale del gestore, categoria, 1 se premium] */
export type CarburanteCompatto = [etichetta: string, categoria: Categoria, premium: 0 | 1];

/** [nome, provincia, latitudine e longitudine del centro dei suoi distributori] */
export type ComuneCompatto = [nome: string, provincia: string, lat: number, lon: number];

/** [carburante, prezzo in millesimi di euro, opzioni (SELF, VECCHIO), giorni dalla comunicazione] */
export type PrezzoCompatto = [carburante: number, millesimi: number, opzioni: number, giorni: number];

export type DistributoreCompatto = [
  id: number,
  nome: string,
  bandiera: number,
  indirizzo: string,
  comune: number,
  lat: number,
  lon: number,
  autostradale: 0 | 1,
  prezzi: PrezzoCompatto[],
];

export interface FilePrezzi {
  versione: number;
  /** giorno a cui si riferiscono i prezzi (alle 8 del mattino), formato "2026-11-17" */
  dataEstrazione: string;
  /** quando il file è stato prodotto, formato ISO in UTC */
  generato: string;
  fonte: string;
  carburanti: CarburanteCompatto[];
  bandiere: string[];
  comuni: ComuneCompatto[];
  distributori: DistributoreCompatto[];
}

// ——— Forma "comoda" usata dall'app dopo la lettura ———

export interface PrezzoApp {
  carburante: string;
  categoria: Categoria;
  premium: boolean;
  euro: number;
  self: boolean;
  vecchio: boolean;
  /** giorno della comunicazione del gestore, formato "2026-11-16" */
  comunicato: string;
}

export interface Comune {
  nome: string;
  provincia: string;
  lat: number;
  lon: number;
}

export interface DistributoreApp {
  id: number;
  nome: string;
  bandiera: string;
  indirizzo: string;
  comune: Comune;
  lat: number;
  lon: number;
  autostradale: boolean;
  prezzi: PrezzoApp[];
}

export interface DatiPrezzi {
  dataEstrazione: string;
  generato: string;
  fonte: string;
  comuni: Comune[];
  distributori: DistributoreApp[];
}

const GIORNO_MS = 86_400_000;

/** Giorno di calendario che precede `data` di `giorni` giorni. */
export function giornoPrima(data: string, giorni: number): string {
  return new Date(Date.parse(`${data}T00:00:00Z`) - giorni * GIORNO_MS).toISOString().slice(0, 10);
}

/** Trasforma il file compatto nella forma comoda per l'app. */
export function decodifica(file: FilePrezzi): DatiPrezzi {
  if (file.versione !== VERSIONE_FORMATO) {
    throw new Error(`Formato del file prezzi non supportato: versione ${String(file.versione)}`);
  }
  const comuni: Comune[] = file.comuni.map(([nome, provincia, lat, lon]) => ({ nome, provincia, lat, lon }));

  const distributori = file.distributori.map(
    ([id, nome, bandiera, indirizzo, comune, lat, lon, autostradale, prezzi]): DistributoreApp => ({
      id,
      nome,
      bandiera: file.bandiere[bandiera] ?? '',
      indirizzo,
      comune: comuni[comune] ?? { nome: '', provincia: '', lat, lon },
      lat,
      lon,
      autostradale: autostradale === 1,
      prezzi: prezzi.map(([carburante, millesimi, opzioni, giorni]): PrezzoApp => {
        const [etichetta, categoria, premium] = file.carburanti[carburante] ?? ['', 'altro', 0];
        return {
          carburante: etichetta,
          categoria,
          premium: premium === 1,
          euro: millesimi / 1000,
          self: (opzioni & SELF) !== 0,
          vecchio: (opzioni & VECCHIO) !== 0,
          comunicato: giornoPrima(file.dataEstrazione, giorni),
        };
      }),
    }),
  );

  return { dataEstrazione: file.dataEstrazione, generato: file.generato, fonte: file.fonte, comuni, distributori };
}
