// Le scelte della mappa che non dipendono da MapLibre (passo 10 di ux-design.md), così si possono testare.
// Unico dominio esterno consentito: le tessere OpenFreeMap (regola privacy 7).

export const DOMINIO_TESSERE = 'https://tiles.openfreemap.org/';

/** Stile chiaro e scuro di OpenFreeMap; la desaturazione la fa il CSS (--filtro-mappa). */
export const STILI = {
  chiaro: `${DOMINIO_TESSERE}styles/positron`,
  scuro: `${DOMINIO_TESSERE}styles/dark`,
} as const;

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
