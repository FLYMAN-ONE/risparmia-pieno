import { describe, expect, it } from 'vitest';
import { giornoPrima } from './formato.ts';

describe('giornoPrima', () => {
  it('conta i giorni all’indietro, anche a cavallo di mese e anno', () => {
    expect(giornoPrima('2026-11-17', 0)).toBe('2026-11-17');
    expect(giornoPrima('2026-11-17', 1)).toBe('2026-11-16');
    expect(giornoPrima('2026-03-01', 1)).toBe('2026-02-28');
    expect(giornoPrima('2027-01-02', 5)).toBe('2026-12-28');
  });
});
