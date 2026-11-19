import { describe, expect, it } from 'vitest';
import { CSP, DOMINI_ESTERNI, REGOLE_CSP } from './csp.ts';

describe('CSP', () => {
  it("l'unico dominio esterno è quello delle tessere OpenFreeMap (regola privacy 7)", () => {
    expect(DOMINI_ESTERNI).toEqual(['https://tiles.openfreemap.org/']);
    const domini = [...CSP.matchAll(/https?:\/\/[^\s;]+/g)].map((m) => m[0]);
    expect(new Set(domini)).toEqual(new Set(DOMINI_ESTERNI));
  });
  it('si parte da "tutto vietato"', () => {
    expect(REGOLE_CSP['default-src']).toBe("'none'");
  });
  it('niente codice o stili scritti nella pagina, niente eval', () => {
    expect(CSP).not.toContain('unsafe-inline');
    expect(CSP).not.toContain('unsafe-eval');
    expect(REGOLE_CSP['script-src']).toBe("'self'");
  });
  it('niente plugin, pagine incorporate o moduli che inviano dati', () => {
    for (const regola of ['object-src', 'frame-src', 'base-uri', 'form-action']) expect(REGOLE_CSP[regola]).toBe("'none'");
  });
});
