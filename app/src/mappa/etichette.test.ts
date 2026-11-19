import { describe, expect, it } from 'vitest';
import { scegliEtichette } from './etichette.ts';

const misura = { larghezza: 60, altezza: 28, distacco: 4 };
const p = (x: number, y: number, vecchio = false) => ({ x, y, vecchio });

describe('scegliEtichette', () => {
  it('distributori lontani tra loro: tutti con l\'etichetta', () => {
    const punti = [p(0, 0), p(200, 0), p(0, 200)];
    expect(scegliEtichette(punti, misura).size).toBe(3);
  });

  it('due vicini: l\'etichetta va al più economico (il primo), l\'altro resta pallino', () => {
    const economico = p(100, 100);
    const caro = p(120, 105);
    const scelti = scegliEtichette([economico, caro], misura);
    expect(scelti.has(economico)).toBe(true);
    expect(scelti.has(caro)).toBe(false);
  });

  it('il prezzo vecchio cede il posto a uno aggiornato, anche se costa meno', () => {
    const vecchio = p(100, 100, true);
    const aggiornato = p(110, 100);
    const scelti = scegliEtichette([vecchio, aggiornato], misura);
    expect([...scelti]).toEqual([aggiornato]);
  });

  it('etichette affiancate: serve almeno la larghezza più il distacco', () => {
    expect(scegliEtichette([p(0, 0), p(63, 0)], misura).size).toBe(1);
    expect(scegliEtichette([p(0, 0), p(64, 0)], misura).size).toBe(2);
  });

  it('una sopra l\'altra: serve almeno l\'altezza più il distacco', () => {
    expect(scegliEtichette([p(0, 0), p(0, 31)], misura).size).toBe(1);
    expect(scegliEtichette([p(0, 0), p(0, 32)], misura).size).toBe(2);
  });

  it('nessun distributore: nessuna etichetta', () => {
    expect(scegliEtichette([], misura).size).toBe(0);
  });
});
