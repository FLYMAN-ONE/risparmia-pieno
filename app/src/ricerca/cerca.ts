// Ricerca dei comuni, tutta sul telefono (regola privacy 5): nessun servizio esterno sa cosa cerchi.
// I comuni sono quelli del file dei prezzi (solo quelli con almeno un distributore).
import type { Comune } from '../../../condiviso/formato.ts';

/** "Sant'Angelo d'Alife" → "sant angelo d alife": niente accenti, maiuscole, apostrofi o trattini */
export function normalizza(testo: string): string {
  return testo
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('it-IT')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Errori di battitura tra a e b (lettere sbagliate, mancanti, in più o scambiate), fino a `massimo`. */
export function errori(a: string, b: string, massimo: number): number {
  if (Math.abs(a.length - b.length) > massimo) return massimo + 1;
  let primaPrima: number[] = [];
  let prima = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const riga = [i];
    let minimo = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(prima[j]! + 1, riga[j - 1]! + 1, prima[j - 1]! + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, primaPrima[j - 2]! + 1);
      riga.push(d);
      minimo = Math.min(minimo, d);
    }
    if (minimo > massimo) return massimo + 1;
    primaPrima = prima;
    prima = riga;
  }
  return prima[b.length]!;
}

/** Quanti errori di battitura si tollerano: nessuno sotto le 4 lettere, uno fino a 6, poi due. */
function tolleranza(lunghezza: number): number {
  return lunghezza < 4 ? 0 : lunghezza < 7 ? 1 : 2;
}

export interface Trovato {
  comune: Comune;
  /** più basso = più pertinente */
  punteggio: number;
}

/**
 * I comuni che corrispondono a quanto scritto, dal più pertinente:
 * nome uguale, poi nomi che iniziano così, poi una parola del nome che inizia così,
 * poi nomi che contengono il testo, infine quelli con qualche errore di battitura.
 */
export function cercaComuni(
  comuni: readonly Comune[],
  testo: string,
  /** a parità di corrispondenza, prima i comuni più importanti (nell'app: con più distributori) */
  importanza: (comune: Comune) => number = () => 0,
  quanti = 8,
): Comune[] {
  const cercato = normalizza(testo);
  if (cercato.length < 2) return [];
  const massimo = tolleranza(cercato.length);
  const trovati: Trovato[] = [];
  for (const comune of comuni) {
    const nome = normalizza(comune.nome);
    let punteggio: number | undefined;
    if (nome === cercato) punteggio = 0;
    else if (nome.startsWith(cercato)) punteggio = 1;
    else if (nome.includes(` ${cercato}`)) punteggio = 2;
    else if (nome.includes(cercato)) punteggio = 3;
    else if (massimo > 0) {
      // l'inizio del nome, lungo quanto il testo scritto (si sta ancora scrivendo), oppure il nome intero
      const d = Math.min(
        errori(cercato, nome.slice(0, cercato.length), massimo),
        errori(cercato, nome, massimo),
      );
      if (d <= massimo) punteggio = 3 + d;
    }
    if (punteggio !== undefined) trovati.push({ comune, punteggio });
  }
  return trovati
    .sort(
      (a, b) =>
        a.punteggio - b.punteggio ||
        importanza(b.comune) - importanza(a.comune) ||
        a.comune.nome.length - b.comune.nome.length ||
        a.comune.nome.localeCompare(b.comune.nome, 'it'),
    )
    .slice(0, quanti)
    .map((t) => t.comune);
}
