import { describe, expect, it } from 'vitest';
import { contrasto } from './contrasto.ts';

describe('contrasto', () => {
  it('nero su bianco vale 21', () => {
    expect(contrasto('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('un colore su sé stesso vale 1', () => {
    expect(contrasto('#F5A524', '#F5A524')).toBe(1);
  });

  it("non dipende dall'ordine", () => {
    expect(contrasto('#1C2126', '#F2F1EE')).toBe(contrasto('#F2F1EE', '#1C2126'));
  });

  it('il grigio #767676 su bianco è al limite AA (4,54)', () => {
    expect(contrasto('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
  });

  it('rifiuta un colore scritto male', () => {
    expect(() => contrasto('rosso', '#FFFFFF')).toThrow('Colore non valido');
  });
});
