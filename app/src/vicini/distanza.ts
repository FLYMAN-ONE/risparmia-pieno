// Distanza in linea d'aria tra due punti sulla Terra (formula dell'emisenoverso, "haversine").
// Il calcolo avviene solo sul telefono: le coordinate non escono mai.

export interface Punto {
  lat: number;
  lon: number;
}

/** Raggio medio della Terra in km */
const RAGGIO_TERRA_KM = 6371;
const RADIANTI = Math.PI / 180;

export function distanzaKm(a: Punto, b: Punto): number {
  const dLat = (b.lat - a.lat) * RADIANTI;
  const dLon = (b.lon - a.lon) * RADIANTI;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RADIANTI) * Math.cos(b.lat * RADIANTI) * Math.sin(dLon / 2) ** 2;
  return 2 * RAGGIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
