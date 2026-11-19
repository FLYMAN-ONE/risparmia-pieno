// Contrasto tra due colori secondo WCAG 2: da 1 (uguali) a 21 (nero su bianco).
// Il minimo per il testo normale (livello AA) è 4,5.

export const MINIMO_AA = 4.5;

/** Luminosità percepita di un colore "#RRGGBB", da 0 (nero) a 1 (bianco). */
export function luminanza(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Colore non valido: ${hex}`);
  const n = parseInt(hex.slice(1), 16);
  const lineare = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lineare((n >> 16) & 255) + 0.7152 * lineare((n >> 8) & 255) + 0.0722 * lineare(n & 255);
}

export function contrasto(a: string, b: string): number {
  const la = luminanza(a);
  const lb = luminanza(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
