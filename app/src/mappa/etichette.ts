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
}

/**
 * I punti arrivano già in ordine di prezzo (dal più basso). Prima i prezzi aggiornati, poi quelli vecchi.
 * L'etichetta sta sopra il punto, centrata: si sceglie solo se non tocca un'etichetta già scelta.
 */
export function scegliEtichette<T extends SulloSchermo>(punti: readonly T[], { larghezza, altezza, distacco }: Misura): Set<T> {
  const scelti = new Set<T>();
  const occupati: { x: number; y: number }[] = [];
  const inOrdine = [...punti.filter((p) => !p.vecchio), ...punti.filter((p) => p.vecchio)];
  for (const punto of inOrdine) {
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
