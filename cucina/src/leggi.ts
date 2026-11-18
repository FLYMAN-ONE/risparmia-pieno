// Lettura dei due file MIMIT. Il formato è descritto in cucina/FORMATO-MIMIT.md.

/** Un distributore come compare nell'anagrafica. */
export interface Impianto {
  id: number;
  bandiera: string;
  tipo: string;
  nome: string;
  indirizzo: string;
  comune: string;
  provincia: string;
  /** null se la coordinata manca o vale zero */
  lat: number | null;
  lon: number | null;
}

/** Un prezzo come compare nel file dei prezzi. */
export interface Prezzo {
  idImpianto: number;
  /** etichetta originale del gestore, per esempio "Blue Diesel" */
  carburante: string;
  euro: number;
  self: boolean;
  /** data della comunicazione del gestore, ora italiana, formato "2026-11-11T14:00:12" */
  comunicato: string;
}

/** Una riga che non si è riusciti a leggere, con il motivo. */
export interface RigaScartata {
  numero: number;
  motivo: string;
}

export interface Letto<T> {
  /** data dell'estrazione indicata nella prima riga, formato "2026-11-17" */
  dataEstrazione: string;
  righe: T[];
  scartate: RigaScartata[];
}

export const INTESTAZIONE_ANAGRAFICA =
  'idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine';
export const INTESTAZIONE_PREZZI = 'idImpianto|descCarburante|prezzo|isSelf|dtComu';

/** Valori noti della colonna "Tipo Impianto": servono come punto di riferimento nelle righe difettose. */
const TIPI_IMPIANTO = new Set(['Stradale', 'Autostradale']);

/** Divide il file in righe, controlla data e intestazione e passa ogni riga di dati a `leggiRiga`. */
function leggiFile<T>(
  testo: string,
  intestazioneAttesa: string,
  leggiRiga: (campi: string[]) => T | string,
): Letto<T> {
  const righe = testo.split(/\r?\n/);
  const data = /^Estrazione del (\d{4}-\d{2}-\d{2})$/.exec((righe[0] ?? '').trim());
  if (!data?.[1]) {
    throw new Error(`Prima riga inattesa: "${righe[0] ?? ''}" (atteso "Estrazione del AAAA-MM-GG")`);
  }
  const intestazione = (righe[1] ?? '').trim();
  if (intestazione !== intestazioneAttesa) {
    throw new Error(`Intestazione cambiata: "${intestazione}" (attesa "${intestazioneAttesa}")`);
  }

  const risultato: Letto<T> = { dataEstrazione: data[1], righe: [], scartate: [] };
  for (let i = 2; i < righe.length; i++) {
    const riga = righe[i] ?? '';
    if (riga.trim() === '') continue;
    const letto = leggiRiga(riga.split('|'));
    if (typeof letto === 'string') {
      risultato.scartate.push({ numero: i + 1, motivo: letto });
    } else {
      risultato.righe.push(letto);
    }
  }
  return risultato;
}

/** Toglie virgolette ai bordi, tab e spazi doppi. */
export function pulisciTesto(testo: string): string {
  return testo
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^"+|"+$/g, '')
    .trim();
}

function leggiId(testo: string | undefined): number | null {
  const t = (testo ?? '').trim();
  return /^\d+$/.test(t) ? Number(t) : null;
}

function leggiCoordinata(testo: string | undefined): number | null {
  const valore = Number.parseFloat((testo ?? '').trim());
  return Number.isFinite(valore) && valore !== 0 ? valore : null;
}

/**
 * Legge una riga dell'anagrafica. Alcuni nomi contengono il separatore "|",
 * quindi i campi si leggono dai due capi: l'id dall'inizio, gli ultimi 5 dalla fine,
 * e in mezzo si usa il "Tipo Impianto" come punto di riferimento.
 */
function leggiImpianto(campi: string[]): Impianto | string {
  const n = campi.length;
  if (n < 10) return `${n} campi invece di 10`;

  const id = leggiId(campi[0]);
  if (id === null) return `idImpianto non valido: "${campi[0] ?? ''}"`;

  // Il tipo sta dopo almeno gestore e bandiera, e prima di almeno nome e i 5 campi finali
  let posTipo = -1;
  for (let i = 3; i <= n - 7; i++) {
    if (TIPI_IMPIANTO.has((campi[i] ?? '').trim())) {
      posTipo = i;
      break;
    }
  }
  if (posTipo === -1) return 'tipo impianto non riconosciuto';

  return {
    id,
    bandiera: pulisciTesto(campi[posTipo - 1] ?? ''),
    tipo: (campi[posTipo] ?? '').trim(),
    nome: pulisciTesto(campi.slice(posTipo + 1, n - 5).join('|')),
    indirizzo: pulisciTesto(campi[n - 5] ?? ''),
    comune: pulisciTesto(campi[n - 4] ?? ''),
    provincia: pulisciTesto(campi[n - 3] ?? ''),
    lat: leggiCoordinata(campi[n - 2]),
    lon: leggiCoordinata(campi[n - 1]),
  };
}

/** Legge una riga dei prezzi. */
function leggiPrezzo(campi: string[]): Prezzo | string {
  if (campi.length !== 5) return `${campi.length} campi invece di 5`;
  const [idTesto, carburante, prezzoTesto, selfTesto, dataTesto] = campi.map((c) => c.trim());

  const idImpianto = leggiId(idTesto);
  if (idImpianto === null) return `idImpianto non valido: "${idTesto ?? ''}"`;

  const euro = Number(prezzoTesto);
  if (!prezzoTesto || !Number.isFinite(euro)) return `prezzo non valido: "${prezzoTesto ?? ''}"`;

  if (selfTesto !== '0' && selfTesto !== '1') return `isSelf non valido: "${selfTesto ?? ''}"`;

  const data = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(dataTesto ?? '');
  if (!data) return `data non valida: "${dataTesto ?? ''}"`;
  const [, gg, mm, aaaa, ore, min, sec] = data;

  return {
    idImpianto,
    carburante: pulisciTesto(carburante ?? ''),
    euro,
    self: selfTesto === '1',
    comunicato: `${aaaa}-${mm}-${gg}T${ore}:${min}:${sec}`,
  };
}

export function leggiAnagrafica(testo: string): Letto<Impianto> {
  return leggiFile(testo, INTESTAZIONE_ANAGRAFICA, leggiImpianto);
}

export function leggiPrezzi(testo: string): Letto<Prezzo> {
  return leggiFile(testo, INTESTAZIONE_PREZZI, leggiPrezzo);
}
