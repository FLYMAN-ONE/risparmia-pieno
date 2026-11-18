import { describe, expect, it } from 'vitest';
import { formattaPrezzo } from './prezzo.ts';

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
