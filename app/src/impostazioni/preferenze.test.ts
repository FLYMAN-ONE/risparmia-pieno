import { describe, expect, it } from 'vitest';
import { cambiaCarburante, filtriDa, leggiPreferenze, salvaPreferenze, type Preferenze } from './preferenze.ts';

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

  it('ricorda anche self/servito e raggio', () => {
    const memoria = memoriaFinta();
    salvaPreferenze({ carburante: 'benzina', modalita: 'servito', raggioKm: 15 }, memoria);
    expect(leggiPreferenze(memoria)).toEqual({ carburante: 'benzina', modalita: 'servito', raggioKm: 15 });
  });

  it('ricorda che Naviga è già stato usato, e accetta solo "sì"', () => {
    const memoria = memoriaFinta();
    salvaPreferenze({ carburante: 'gpl', navigaUsato: true }, memoria);
    expect(leggiPreferenze(memoria)).toEqual({ carburante: 'gpl', navigaUsato: true });
    expect(leggiPreferenze(memoriaFinta({ 'risparmia-pieno.preferenze': '{"navigaUsato":"verso Roma"}' }))).toEqual({});
  });

  it('ignora un raggio non previsto', () => {
    const memoria = memoriaFinta({ 'risparmia-pieno.preferenze': '{"carburante":"gpl","raggioKm":50}' });
    expect(leggiPreferenze(memoria)).toEqual({ carburante: 'gpl' });
  });

  it('ricorda tema e colore della mappa', () => {
    const memoria = memoriaFinta();
    salvaPreferenze({ tema: 'chiaro', mappa: 'blu' }, memoria);
    expect(leggiPreferenze(memoria)).toEqual({ tema: 'chiaro', mappa: 'blu' });
  });

  it('i valori di partenza (automatico, come il tema) non si salvano', () => {
    const memoria = memoriaFinta();
    salvaPreferenze({ carburante: 'gpl', tema: 'automatico', mappa: 'tema' }, memoria);
    expect(memoria.dati['risparmia-pieno.preferenze']).toBe('{"carburante":"gpl"}');
  });

  it('ignora temi e mappe sconosciuti', () => {
    const memoria = memoriaFinta({ 'risparmia-pieno.preferenze': '{"tema":"rosa","mappa":"satellite"}' });
    expect(leggiPreferenze(memoria)).toEqual({});
  });
});

describe('filtriDa', () => {
  it('senza scelte: self e 5 km per la benzina', () => {
    expect(filtriDa({ carburante: 'benzina' })).toEqual({ carburante: 'benzina', modalita: 'self', raggioKm: 5 });
  });

  it('senza scelte: self e servito insieme per il GPL', () => {
    expect(filtriDa({ carburante: 'gpl' }).modalita).toBe('tutte');
  });

  it('usa le scelte salvate', () => {
    expect(filtriDa({ carburante: 'gasolio', modalita: 'servito', raggioKm: 10 })).toEqual({
      carburante: 'gasolio',
      modalita: 'servito',
      raggioKm: 10,
    });
  });
});

describe('cambiaCarburante', () => {
  it('rimette self/servito adatto al nuovo carburante e tiene il raggio', () => {
    const nuove = cambiaCarburante({ carburante: 'benzina', modalita: 'servito', raggioKm: 10 }, 'gpl');
    expect(filtriDa(nuove as Required<Preferenze>)).toEqual({ carburante: 'gpl', modalita: 'tutte', raggioKm: 10 });
  });
});
