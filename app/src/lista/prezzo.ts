/** Unità di misura del prezzo: litro per i liquidi, chilo per il metano. */
export type Unita = 'l' | 'kg';

const formatoItaliano = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

/**
 * Scrive un prezzo come sui cartelloni italiani, con la virgola decimale.
 * Esempio: formattaPrezzo(1.689, 'l') → "1,689 €/l"
 */
export function formattaPrezzo(euro: number, unita: Unita): string {
  return `${formatoItaliano.format(euro)} €/${unita}`;
}

/** Solo le cifre, per le righe della lista: "1,689" */
export function formattaCifre(euro: number): string {
  return formatoItaliano.format(euro);
}

const formatoCentesimi = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Differenza dalla media, col segno vero: "−0,04 €", "+0,02 €", "0,00 €" */
export function formattaDifferenza(euro: number): string {
  const centesimi = Math.round(euro * 100);
  const segno = centesimi < 0 ? '−' : centesimi > 0 ? '+' : '';
  return `${segno}${formatoCentesimi.format(Math.abs(centesimi) / 100)} €`;
}

const formatoKm = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Distanza con un decimale: "1,2 km", "0,4 km" */
export function formattaKm(km: number): string {
  return `${formatoKm.format(km)} km`;
}
