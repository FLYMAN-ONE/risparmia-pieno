// Preferenze dell'utente, salvate sul telefono: SOLO le scelte (carburante, raggio…),
// MAI la posizione. Se la memoria del browser non è disponibile (navigazione privata,
// dati cancellati), l'app funziona lo stesso e richiede la scelta.
import type { Categoria } from '../../../condiviso/carburanti.ts';

/** I carburanti tra cui si sceglie ("altro" no: GNL e simili sono per i camion). */
export const CARBURANTI_SCELTI = ['benzina', 'gasolio', 'gpl', 'metano', 'hvo'] as const satisfies readonly Categoria[];
export type CarburanteScelto = (typeof CARBURANTI_SCELTI)[number];

export interface Preferenze {
  carburante?: CarburanteScelto;
}

const CHIAVE = 'risparmia-pieno.preferenze';

function memoriaDelTelefono(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function leggiPreferenze(memoria: Storage | undefined = memoriaDelTelefono()): Preferenze {
  try {
    const salvate: unknown = JSON.parse(memoria?.getItem(CHIAVE) ?? '{}');
    const carburante = (salvate as { carburante?: unknown }).carburante;
    // Si tiene solo ciò che si riconosce: un valore strano o vecchio viene ignorato
    if (CARBURANTI_SCELTI.includes(carburante as CarburanteScelto)) {
      return { carburante: carburante as CarburanteScelto };
    }
  } catch {
    // memoria non leggibile o testo rovinato: si riparte da zero
  }
  return {};
}

export function salvaPreferenze(preferenze: Preferenze, memoria: Storage | undefined = memoriaDelTelefono()): void {
  try {
    // Si scrivono solo i campi previsti, uno per uno: nient'altro può finire in memoria
    const daSalvare: Preferenze = {};
    if (preferenze.carburante) daSalvare.carburante = preferenze.carburante;
    memoria?.setItem(CHIAVE, JSON.stringify(daSalvare));
  } catch {
    // memoria piena o bloccata: la scelta vale solo per questa volta
  }
}
