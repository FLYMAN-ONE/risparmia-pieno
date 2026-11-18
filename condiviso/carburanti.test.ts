import { describe, expect, it } from 'vitest';
import { unitaDi } from './carburanti.ts';

describe('unitaDi', () => {
  it('il metano si vende al chilo, gli altri al litro', () => {
    expect(unitaDi('metano')).toBe('kg');
    expect(unitaDi('gasolio')).toBe('l');
  });
});
