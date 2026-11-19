import { describe, expect, it } from 'vitest';
import { giornoBreve, testoDataPrezzi } from './data.ts';

describe('data dei prezzi', () => {
  it('scrive giorno e mese', () => {
    expect(giornoBreve('2026-11-19')).toBe('19/11');
    expect(giornoBreve('2027-01-05')).toBe('05/01');
  });

  it('dice anche che sono i prezzi delle 8', () => {
    expect(testoDataPrezzi('2026-11-19')).toBe('Prezzi del 19/11, ore 8');
  });
});
