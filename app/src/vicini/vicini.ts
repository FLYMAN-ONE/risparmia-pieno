// Trova i distributori entro un raggio dalla posizione, sul telefono.
import { distanzaKm, type Punto } from './distanza.ts';


/** Raggi tra cui scegliere (registro delle decisioni, 18/11/2026). All'apertura: 5 km. */
export const RAGGI_KM = [5, 10, 15] as const;
export type RaggioKm = (typeof RAGGI_KM)[number];
export const RAGGIO_INIZIALE: RaggioKm = 5;

export interface Vicino<T> {
  distributore: T;
  km: number;
}

/** Km per grado di latitudine: serve per scartare in fretta i distributori lontani. */
const KM_PER_GRADO = 111.2;

/** I distributori entro `raggioKm` (bordo compreso), dal più vicino al più lontano. */
export function entroRaggio<T extends Punto>(distributori: readonly T[], centro: Punto, raggioKm: number): Vicino<T>[] {
  // Primo filtro veloce: un "quadrato" attorno al centro, poi la distanza vera solo per chi è dentro
  const gradiLat = raggioKm / KM_PER_GRADO;
  const gradiLon = raggioKm / (KM_PER_GRADO * Math.max(0.01, Math.cos((centro.lat * Math.PI) / 180)));

  const vicini: Vicino<T>[] = [];
  for (const distributore of distributori) {
    if (Math.abs(distributore.lat - centro.lat) > gradiLat) continue;
    if (Math.abs(distributore.lon - centro.lon) > gradiLon) continue;
    const km = distanzaKm(centro, distributore);
    if (km <= raggioKm) vicini.push({ distributore, km });
  }
  return vicini.sort((a, b) => a.km - b.km);
}

/** Quanto deve spostarsi la mappa, in proporzione al raggio, perché i prezzi si ricalcolino */
export const SPOSTAMENTO_MINIMO = 0.2;

/**
 * Spostando la mappa, i prezzi si ricalcolano intorno al nuovo centro solo se ci si è spostati
 * abbastanza (1 km con il raggio di 5 km): così piccoli ritocchi non fanno cambiare colori e lista.
 */
export function spostamentoSignificativo(prima: Punto, dopo: Punto, raggioKm: number): boolean {
  return distanzaKm(prima, dopo) >= raggioKm * SPOSTAMENTO_MINIMO;
}
