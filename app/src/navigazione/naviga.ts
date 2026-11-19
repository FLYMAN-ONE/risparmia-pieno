// Tasto "Naviga": apre l'app di navigazione del telefono con la destinazione (regola privacy 9).
// Parte solo dal tocco dell'utente. Nel link c'è solo la posizione del distributore,
// mai quella dell'utente: il percorso lo calcola l'app di navigazione con il suo GPS.

export type AppMappe = 'apple' | 'google';

/** iPhone, iPad e Mac usano Mappe di Apple (l'iPad recente si presenta come un Mac); tutti gli altri Google Maps. */
export function appMappeDi(userAgent: string): AppMappe {
  return /iPhone|iPad|iPod|Macintosh/.test(userAgent) ? 'apple' : 'google';
}

const coordinata = (n: number): string => n.toFixed(6);

/** Il link che apre la navigazione in auto verso il distributore. */
export function linkNavigazione(lat: number, lon: number, app: AppMappe): string {
  const destinazione = `${coordinata(lat)},${coordinata(lon)}`;
  return app === 'apple'
    ? `https://maps.apple.com/?daddr=${destinazione}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${destinazione}&travelmode=driving`;
}
