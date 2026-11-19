import { describe, expect, it } from 'vitest';
import { disegnaSuggerimenti, nomeComune } from './suggerimenti.ts';

const comune = (nome: string, provincia: string) => ({ nome, provincia, lat: 45, lon: 9 });

describe('suggerimenti', () => {
  it('nome scritto normale, con la provincia', () => {
    expect(nomeComune(comune("SANT'ANGELO LODIGIANO", 'LO'))).toBe("Sant'Angelo Lodigiano");
    const html = disegnaSuggerimenti('gall', [{ comune: comune('GALLARATE', 'VA'), indice: 42 }]);
    expect(html).toContain('data-comune="42"');
    expect(html).toContain('<span class="nome">Gallarate</span><span class="provincia">VA</span>');
  });

  it('meno di 2 lettere: invito a scrivere; niente trovato: lo dice', () => {
    expect(disegnaSuggerimenti('g', [])).toContain('Scrivi il nome di un comune.');
    expect(disegnaSuggerimenti('zzzz', [])).toContain('Nessun comune trovato.');
  });
});
