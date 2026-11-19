import { describe, expect, it } from 'vitest';
import { formattaCifre, formattaDifferenza, formattaKm, formattaPrezzo } from './prezzo.ts';

describe('formattaPrezzo', () => {
  it('usa la virgola decimale e tre cifre', () => {
    expect(formattaPrezzo(1.689, 'l')).toBe('1,689 €/l');
  });

  it('aggiunge gli zeri mancanti', () => {
    expect(formattaPrezzo(1.7, 'l')).toBe('1,700 €/l');
  });

  it('arrotonda alla terza cifra', () => {
    expect(formattaPrezzo(1.6894, 'l')).toBe('1,689 €/l');
  });

  it('per il metano usa €/kg', () => {
    expect(formattaPrezzo(1.349, 'kg')).toBe('1,349 €/kg');
  });
});

describe('formattaCifre', () => {
  it('solo le cifre, con tre decimali', () => {
    expect(formattaCifre(1.7)).toBe('1,700');
  });
});

describe('formattaDifferenza', () => {
  it('in meno, con il vero segno meno', () => {
    expect(formattaDifferenza(-0.04)).toBe('−0,04 €');
  });

  it('in più, con il segno più', () => {
    expect(formattaDifferenza(0.0249)).toBe('+0,02 €');
  });

  it('sotto il mezzo centesimo è zero, senza segno', () => {
    expect(formattaDifferenza(-0.004)).toBe('0,00 €');
  });
});

describe('formattaKm', () => {
  it('un decimale con la virgola', () => {
    expect(formattaKm(1.234)).toBe('1,2 km');
    expect(formattaKm(0.36)).toBe('0,4 km');
  });
});
