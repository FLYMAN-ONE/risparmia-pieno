// Preferenze dell'utente, salvate sul telefono: SOLO le scelte (carburante, self/servito, raggio),
// MAI la posizione. Se la memoria del browser non è disponibile (navigazione privata,
// dati cancellati), l'app funziona lo stesso e richiede la scelta.
import type { Categoria } from '../../../condiviso/carburanti.ts';
import { modalitaPredefinita, type Modalita } from '../lista/lista.ts';
import { RAGGI_KM, RAGGIO_INIZIALE, type RaggioKm } from '../vicini/vicini.ts';

/** I carburanti tra cui si sceglie ("altro" no: GNL e simili sono per i camion). */
export const CARBURANTI_SCELTI = ['benzina', 'gasolio', 'gpl', 'metano', 'hvo'] as const satisfies readonly Categoria[];
export type CarburanteScelto = (typeof CARBURANTI_SCELTI)[number];

export const MODALITA = ['self', 'servito', 'tutte'] as const satisfies readonly Modalita[];

export interface Preferenze {
  carburante?: CarburanteScelto;
  modalita?: Modalita;
  raggioKm?: RaggioKm;
}

/** Le scelte da usare davvero: quelle salvate, oppure quelle di partenza. */
export interface Filtri {
  carburante: CarburanteScelto;
  modalita: Modalita;
  raggioKm: RaggioKm;
}

export function filtriDa(preferenze: Preferenze & { carburante: CarburanteScelto }): Filtri {
  return {
    carburante: preferenze.carburante,
    modalita: preferenze.modalita ?? modalitaPredefinita(preferenze.carburante),
    raggioKm: preferenze.raggioKm ?? RAGGIO_INIZIALE,
  };
}

/** Cambiando carburante, self/servito torna quello adatto al nuovo carburante. */
export function cambiaCarburante(preferenze: Preferenze, carburante: CarburanteScelto): Preferenze {
  const { modalita: _vecchia, ...resto } = preferenze;
  return { ...resto, carburante };
}

const CHIAVE = 'risparmia-pieno.preferenze';

function memoriaDelTelefono(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

const unoTra = <T>(ammessi: readonly T[], valore: unknown): T | undefined =>
  ammessi.includes(valore as T) ? (valore as T) : undefined;

/** Tiene solo i campi previsti e con valori riconosciuti: un valore strano o vecchio viene ignorato. */
function pulisci(grezze: unknown): Preferenze {
  const g = (grezze ?? {}) as Record<string, unknown>;
  const pulite: Preferenze = {};
  const carburante = unoTra(CARBURANTI_SCELTI, g['carburante']);
  const modalita = unoTra(MODALITA, g['modalita']);
  const raggioKm = unoTra(RAGGI_KM, g['raggioKm']);
  if (carburante) pulite.carburante = carburante;
  if (modalita) pulite.modalita = modalita;
  if (raggioKm) pulite.raggioKm = raggioKm;
  return pulite;
}

export function leggiPreferenze(memoria: Storage | undefined = memoriaDelTelefono()): Preferenze {
  try {
    return pulisci(JSON.parse(memoria?.getItem(CHIAVE) ?? '{}'));
  } catch {
    return {}; // memoria non leggibile o testo rovinato: si riparte da zero
  }
}

export function salvaPreferenze(preferenze: Preferenze, memoria: Storage | undefined = memoriaDelTelefono()): void {
  try {
    // Si scrivono solo i campi previsti: nient'altro può finire in memoria
    memoria?.setItem(CHIAVE, JSON.stringify(pulisci(preferenze)));
  } catch {
    // memoria piena o bloccata: la scelta vale solo per questa volta
  }
}
