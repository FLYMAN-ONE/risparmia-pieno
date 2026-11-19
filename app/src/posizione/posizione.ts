// Posizione dell'utente. Regole di privacy (CLAUDE.md):
// - si chiede solo quando l'utente tocca "Intorno a me", mai all'apertura;
// - il risultato si restituisce e basta: niente salvataggi, niente log, niente invii.
//   Chi la riceve la tiene solo in memoria finché l'app è aperta.

export interface Posizione {
  lat: number;
  lon: number;
}

export type EsitoPosizione =
  | { tipo: 'ok'; posizione: Posizione }
  /** l'utente (o le impostazioni del telefono) non dà il permesso */
  | { tipo: 'negata' }
  /** il permesso c'è ma il GPS non risponde (al chiuso, tempo scaduto, telefono senza GPS) */
  | { tipo: 'non-disponibile' };

const OPZIONI: PositionOptions = {
  // Precisione "normale": basta per un raggio di 5 km e risponde molto prima del GPS preciso
  enableHighAccuracy: false,
  // Dopo 10 secondi si rinuncia e si propone di cercare un comune
  timeout: 10_000,
  // Accetta una posizione trovata dal telefono nell'ultimo minuto: risposta immediata.
  // È la memoria del telefono stesso, l'app non conserva nulla.
  maximumAge: 60_000,
};

const PERMESSO_NEGATO = 1;

export function chiediPosizione(
  gps: Geolocation | undefined = globalThis.navigator?.geolocation,
): Promise<EsitoPosizione> {
  if (!gps) return Promise.resolve({ tipo: 'non-disponibile' });
  return new Promise((risolvi) => {
    gps.getCurrentPosition(
      ({ coords }) => risolvi({ tipo: 'ok', posizione: { lat: coords.latitude, lon: coords.longitude } }),
      (errore) => risolvi({ tipo: errore.code === PERMESSO_NEGATO ? 'negata' : 'non-disponibile' }),
      OPZIONI,
    );
  });
}
