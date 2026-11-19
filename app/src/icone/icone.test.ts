import { describe, expect, it } from 'vitest';
import { ICONE, icona, type NomeIcona } from './icone.ts';

describe('icone', () => {
  for (const nome of Object.keys(ICONE) as NomeIcona[]) {
    it(`"${nome}" esiste ed è nascosta ai lettori di schermo`, () => {
      const svg = icona(nome);
      expect(svg.startsWith('<svg aria-hidden="true" focusable="false"')).toBe(true);
      expect(svg).toContain('stroke="currentColor"'); // prende il colore del testo
    });
  }
});
