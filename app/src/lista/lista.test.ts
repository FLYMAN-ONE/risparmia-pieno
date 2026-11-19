import { describe, expect, it } from 'vitest';
import type { DistributoreApp, PrezzoApp } from '../../../condiviso/formato.ts';
import { modalitaPredefinita, ordina, preparaLista } from './lista.ts';

function prezzo(categoria: PrezzoApp['categoria'], euro: number, altro: Partial<PrezzoApp> = {}): PrezzoApp {
  return { carburante: categoria, categoria, premium: false, euro, self: true, vecchio: false, comunicato: '2026-11-18', ...altro };
}

function vicino(id: number, km: number, prezzi: PrezzoApp[]) {
  const distributore: DistributoreApp = {
    id,
    nome: `Distributore ${String(id)}`,
    bandiera: 'Q8',
    indirizzo: 'Via Roma 1',
    comune: { nome: 'Gallarate', provincia: 'VA', lat: 45.66, lon: 8.79 },
    lat: 45.66,
    lon: 8.79,
    autostradale: false,
    prezzi,
  };
  return { distributore, km };
}

describe('modalitaPredefinita', () => {
  it('self per benzina, gasolio e HVO; tutte per GPL e metano', () => {
    expect(modalitaPredefinita('benzina')).toBe('self');
    expect(modalitaPredefinita('hvo')).toBe('self');
    expect(modalitaPredefinita('gpl')).toBe('tutte');
    expect(modalitaPredefinita('metano')).toBe('tutte');
  });
});

describe('preparaLista', () => {
  it('prende il prezzo del carburante e della modalità scelti, senza premium', () => {
    const lista = preparaLista(
      [
        vicino(1, 1, [
          prezzo('benzina', 1.7),
          prezzo('benzina', 1.6, { self: false }),
          prezzo('benzina', 1.5, { premium: true }),
          prezzo('gasolio', 1.4),
        ]),
      ],
      'benzina',
      'self',
    );
    expect(lista.voci.map((v) => v.euro)).toEqual([1.7]);
  });

  it('con due prezzi dello stesso carburante prende il più basso', () => {
    const lista = preparaLista([vicino(1, 1, [prezzo('gasolio', 1.71), prezzo('gasolio', 1.69)])], 'gasolio', 'self');
    expect(lista.voci[0]?.euro).toBe(1.69);
  });

  it('chi non ha quel carburante non compare', () => {
    const lista = preparaLista([vicino(1, 1, [prezzo('gasolio', 1.6)]), vicino(2, 2, [prezzo('gpl', 0.7)])], 'gpl', 'tutte');
    expect(lista.voci.map((v) => v.distributore.id)).toEqual([2]);
  });

  it('"tutte" unisce self e servito', () => {
    const lista = preparaLista([vicino(1, 1, [prezzo('metano', 1.5, { self: false })])], 'metano', 'tutte');
    expect(lista.voci).toHaveLength(1);
  });

  it('ordina dal prezzo più basso; a parità di prezzo, dal più vicino', () => {
    const lista = preparaLista(
      [vicino(1, 3, [prezzo('benzina', 1.7)]), vicino(2, 2, [prezzo('benzina', 1.65)]), vicino(3, 1, [prezzo('benzina', 1.7)])],
      'benzina',
      'self',
    );
    expect(lista.voci.map((v) => v.distributore.id)).toEqual([2, 3, 1]);
  });

  it('colora per distanza dalla media locale: ±1 centesimo', () => {
    // media = 1,700
    const lista = preparaLista(
      [
        vicino(1, 1, [prezzo('benzina', 1.69)]), // −1 cent: conveniente
        vicino(2, 1, [prezzo('benzina', 1.695)]), // −0,5 cent: nella media
        vicino(3, 1, [prezzo('benzina', 1.705)]), // +0,5 cent: nella media
        vicino(4, 1, [prezzo('benzina', 1.71)]), // +1 cent: caro
      ],
      'benzina',
      'self',
    );
    expect(lista.media).toBeCloseTo(1.7, 6);
    expect(lista.voci.map((v) => [v.distributore.id, v.fascia])).toEqual([
      [1, 'conveniente'],
      [2, 'media'],
      [3, 'media'],
      [4, 'caro'],
    ]);
  });

  it('se tutti hanno lo stesso prezzo, sono tutti "nella media"', () => {
    const lista = preparaLista([vicino(1, 1, [prezzo('benzina', 1.7)]), vicino(2, 2, [prezzo('benzina', 1.7)])], 'benzina', 'self');
    expect(lista.voci.every((v) => v.fascia === 'media')).toBe(true);
  });

  it('il più conveniente è il prezzo più basso tra quelli aggiornati', () => {
    const lista = preparaLista(
      [vicino(1, 1, [prezzo('benzina', 1.5, { vecchio: true })]), vicino(2, 2, [prezzo('benzina', 1.6)]), vicino(3, 3, [prezzo('benzina', 1.7)])],
      'benzina',
      'self',
    );
    expect(lista.voci[0]?.distributore.id).toBe(1); // nella lista c'è, attenuato
    expect(lista.migliore?.distributore.id).toBe(2);
  });

  it('se tutti i prezzi sono vecchi, il più conveniente è comunque il più basso', () => {
    const lista = preparaLista([vicino(1, 1, [prezzo('benzina', 1.6, { vecchio: true })])], 'benzina', 'self');
    expect(lista.migliore?.distributore.id).toBe(1);
  });

  it('senza distributori la lista è vuota', () => {
    expect(preparaLista([], 'benzina', 'self')).toEqual({ voci: [], migliore: undefined, media: 0 });
  });
});

describe('ordina', () => {
  it('per distanza: dal più vicino; a parità, dal più economico', () => {
    const { voci } = preparaLista(
      [vicino(1, 3, [prezzo('benzina', 1.6)]), vicino(2, 1, [prezzo('benzina', 1.8)]), vicino(3, 1, [prezzo('benzina', 1.7)])],
      'benzina',
      'self',
    );
    expect(ordina(voci, 'distanza').map((v) => v.distributore.id)).toEqual([3, 2, 1]);
    expect(ordina(voci, 'prezzo').map((v) => v.distributore.id)).toEqual([1, 3, 2]);
  });
});
