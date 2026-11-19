import { describe, expect, it } from 'vitest';
import { leggiPreferenze, salvaPreferenze, type Preferenze } from './preferenze.ts';

/** Una finta memoria del telefono. */
function memoriaFinta(iniziale: Record<string, string> = {}): Storage & { dati: Record<string, string> } {
  const dati = { ...iniziale };
  return {
    dati,
    getItem: (k: string) => dati[k] ?? null,
    setItem: (k: string, v: string) => {
      dati[k] = v;
    },
  } as Storage & { dati: Record<string, string> };
}

const memoriaRotta = {
  getItem() {
    throw new Error('bloccata');
  },
  setItem() {
    throw new Error('bloccata');
  },
} as unknown as Storage;

describe('preferenze', () => {
  it('al primo uso non c\'è nessun carburante', () => {
    expect(leggiPreferenze(memoriaFinta())).toEqual({});
  });

  it('ricorda il carburante scelto', () => {
    const memoria = memoriaFinta();
    salvaPreferenze({ carburante: 'gpl' }, memoria);
    expect(leggiPreferenze(memoria)).toEqual({ carburante: 'gpl' });
  });

  it('ignora valori sconosciuti o rovinati', () => {
    expect(leggiPreferenze(memoriaFinta({ 'risparmia-pieno.preferenze': '{"carburante":"kerosene"}' }))).toEqual({});
    expect(leggiPreferenze(memoriaFinta({ 'risparmia-pieno.preferenze': '{rotto' }))).toEqual({});
  });

  it('senza memoria del browser funziona lo stesso', () => {
    expect(leggiPreferenze(undefined)).toEqual({});
    expect(leggiPreferenze(memoriaRotta)).toEqual({});
    expect(() => salvaPreferenze({ carburante: 'benzina' }, memoriaRotta)).not.toThrow();
  });

  it('salva solo i campi previsti: niente posizione, anche se qualcuno ce la mette', () => {
    const memoria = memoriaFinta();
    const conIntruso = { carburante: 'gasolio', lat: 45.66, lon: 8.79 } as Preferenze;
    salvaPreferenze(conIntruso, memoria);
    expect(Object.values(memoria.dati).join()).not.toMatch(/lat|lon|45\.66/);
  });
});
