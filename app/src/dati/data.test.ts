import { describe, expect, it } from 'vitest';
import { avvisoRitardo, giornoBreve } from './data.ts';

describe('data dei prezzi', () => {
  it('scrive giorno e mese', () => {
    expect(giornoBreve('2026-11-19')).toBe('19/11');
    expect(giornoBreve('2027-01-05')).toBe('05/01');
  });
});

describe('avvisoRitardo', () => {
  // i prezzi del 18/11 arrivano la mattina del 19/11
  it('nessun avviso finché i prezzi sono quelli attesi', () => {
    expect(avvisoRitardo('2026-11-18', new Date(2026, 10, 19, 9))).toBeUndefined();
    expect(avvisoRitardo('2026-11-18', new Date(2026, 10, 19, 23, 59))).toBeUndefined();
    // la mattina dopo, prima che arrivi il file nuovo: ancora nessun allarme
    expect(avvisoRitardo('2026-11-18', new Date(2026, 10, 20, 11, 59))).toBeUndefined();
  });

  it('avvisa se a mezzogiorno il file nuovo non è arrivato', () => {
    expect(avvisoRitardo('2026-11-18', new Date(2026, 10, 20, 12))).toBe(
      "Prezzi di 2 giorni fa (18/11). L'aggiornamento di oggi non è ancora arrivato.",
    );
    expect(avvisoRitardo('2026-11-18', new Date(2026, 10, 22, 0, 30))).toContain('Prezzi di 4 giorni fa');
  });

  it('conta i giorni anche a cavallo di mese e anno', () => {
    expect(avvisoRitardo('2026-12-30', new Date(2027, 0, 2, 15))).toContain('Prezzi di 3 giorni fa (30/12)');
  });
});
