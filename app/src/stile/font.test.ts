import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./font.css', import.meta.url), 'utf8');
const indirizzi = [...css.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1] ?? '');

describe('font', () => {
  it('ci sono i tre pesi decisi: 400, 600 e 700', () => {
    const pesi = [...css.matchAll(/font-weight:\s*(\d+)/g)].map((m) => m[1]);
    expect(pesi).toEqual(['400', '600', '700']);
  });

  it('ogni file è dentro l\'app, mai su un sito esterno', () => {
    expect(indirizzi).toHaveLength(3);
    for (const indirizzo of indirizzi) {
      expect(indirizzo.startsWith('./')).toBe(true);
      expect(existsSync(new URL(indirizzo, import.meta.url))).toBe(true);
    }
  });

  it('la licenza del font è inclusa', () => {
    expect(existsSync(new URL('./font/OFL-titilliumweb.txt', import.meta.url))).toBe(true);
  });
});
