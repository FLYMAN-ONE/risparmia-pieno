// Le scelte della mappa che non dipendono da MapLibre (passo 10 di ux-design.md), così si possono testare.
// Unico dominio esterno consentito: le tessere OpenFreeMap (regola privacy 7).

export const DOMINIO_TESSERE = 'https://tiles.openfreemap.org/';

/** Gli stili di OpenFreeMap usati dall'app (passo 10 e decisione del 19/11/2026) */
export const STILI = {
  chiaro: `${DOMINIO_TESSERE}styles/positron`,
  scuro: `${DOMINIO_TESSERE}styles/dark`,
  bright: `${DOMINIO_TESSERE}styles/bright`,
  fiord: `${DOMINIO_TESSERE}styles/fiord`,
} as const;

/** Le scelte del colore della mappa nelle impostazioni (stesse di StileMappa in preferenze.ts) */
export type SceltaMappa = 'tema' | 'chiara' | 'blu';

export interface Aspetto {
  url: string;
  /** attenuata dal CSS (--filtro-mappa): i prezzi restano l'unica cosa colorata */
  attenuata: boolean;
  /** cartina scura: serve a scegliere i colori di gruppi e pallini */
  scura: boolean;
}

/**
 * Quale cartina mostrare. "Come il tema": chiara o scura insieme all'app, attenuata.
 * "Chiara": Bright attenuata, anche con l'app scura. "Blu scura": Fiord con i suoi colori.
 */
export function aspettoMappa(scelta: SceltaMappa, appScura: boolean): Aspetto {
  if (scelta === 'chiara') return { url: STILI.bright, attenuata: true, scura: false };
  if (scelta === 'blu') return { url: STILI.fiord, attenuata: false, scura: true };
  return appScura ? { url: STILI.scuro, attenuata: true, scura: true } : { url: STILI.chiaro, attenuata: true, scura: false };
}

/**
 * Ogni richiesta della mappa parte senza referrer (regola privacy 8). Le richieste verso domini
 * diversi da OpenFreeMap vengono bloccate: la mappa non deve contattare nessun altro.
 */
export function richiestaSicura(url: string): { url: string; referrerPolicy: ReferrerPolicy } {
  return { url: url.startsWith(DOMINIO_TESSERE) ? url : 'about:blank', referrerPolicy: 'no-referrer' };
}

export interface Centro {
  lat: number;
  lon: number;
}

/** Il riquadro che contiene il cerchio del raggio: [[ovest, sud], [est, nord]] */
export function confiniRaggio({ lat, lon }: Centro, raggioKm: number): [[number, number], [number, number]] {
  const KM_PER_GRADO = 111.32;
  const dLat = raggioKm / KM_PER_GRADO;
  const dLon = raggioKm / (KM_PER_GRADO * Math.cos((lat * Math.PI) / 180));
  return [
    [lon - dLon, lat - dLat],
    [lon + dLon, lat + dLat],
  ];
}
