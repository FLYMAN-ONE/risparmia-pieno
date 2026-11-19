// Quali distributori hanno l'etichetta col prezzo (passo 10, deciso il 19/11/2026):
// niente gruppi; si parte dal prezzo più basso e si dà l'etichetta solo dove c'è spazio sullo schermo.
// Gli altri restano un pallino colorato. Nessuna dipendenza da MapLibre, così si può testare.

/** Un distributore già proiettato sullo schermo, in pixel. */
export interface SulloSchermo {
  x: number;
  y: number;
  /** prezzo non aggiornato: passa dopo i prezzi aggiornati */
  vecchio: boolean;
}

export interface Misura {
  larghezza: number;
  altezza: number;
  /** spazio minimo tra due etichette */
  distacco: number;
  /** quante etichette al massimo: oltre, la mappa diventa illeggibile */
  massimo?: number;
}

/**
 * I punti arrivano già in ordine di prezzo (dal più basso). Prima i prezzi aggiornati, poi quelli vecchi.
 * L'etichetta sta sopra il punto, centrata: si sceglie solo se non tocca un'etichetta già scelta.
 */
export function scegliEtichette<T extends SulloSchermo>(
  punti: readonly T[],
  { larghezza, altezza, distacco, massimo = Infinity }: Misura,
): Set<T> {
  const scelti = new Set<T>();
  const occupati: { x: number; y: number }[] = [];
  const inOrdine = [...punti.filter((p) => !p.vecchio), ...punti.filter((p) => p.vecchio)];
  for (const punto of inOrdine) {
    if (scelti.size >= massimo) break;
    const x = punto.x - larghezza / 2;
    const y = punto.y - altezza;
    const libero = occupati.every(
      (o) => Math.abs(o.x - x) >= larghezza + distacco || Math.abs(o.y - y) >= altezza + distacco,
    );
    if (libero) {
      occupati.push({ x, y });
      scelti.add(punto);
    }
  }
  return scelti;
}

/** Il riquadro occupato da un'etichetta sullo schermo (sopra il suo punto, centrata). */
export interface Riquadro {
  x: number;
  y: number;
  larghezza: number;
  altezza: number;
}

export function riquadroDi({ x, y }: { x: number; y: number }, { larghezza, altezza }: Pick<Misura, 'larghezza' | 'altezza'>): Riquadro {
  return { x: x - larghezza / 2, y: y - altezza, larghezza, altezza };
}

/** Un cerchio (un gruppo) tocca uno dei riquadri? Se sì, non si disegna: lì c'è già un prezzo. */
export function cerchioCoperto(centro: { x: number; y: number }, raggio: number, riquadri: readonly Riquadro[]): boolean {
  return riquadri.some((r) => {
    const vicinoX = Math.max(r.x, Math.min(centro.x, r.x + r.larghezza));
    const vicinoY = Math.max(r.y, Math.min(centro.y, r.y + r.altezza));
    return (centro.x - vicinoX) ** 2 + (centro.y - vicinoY) ** 2 < raggio ** 2;
  });
}
