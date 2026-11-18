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
