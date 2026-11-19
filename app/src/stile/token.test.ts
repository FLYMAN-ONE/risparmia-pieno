import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Controlla il file dei token: i testi devono restare leggibili (WCAG AA, almeno 4,5:1)
// sia in chiaro sia in scuro, e i due blocchi del tema scuro devono essere identici.

const css = readFileSync(new URL('./token.css', import.meta.url), 'utf8');

/** Il valore di un token; se manca, il test fallisce con un messaggio chiaro. */
function colore(tema: Record<string, string>, nome: string): string {
  const valore = tema[nome];
  if (!valore) throw new Error(`Token mancante: --${nome}`);
  return valore;
}

/** Legge le variabili --nome: #RRGGBB del primo blocco che segue il selettore dato. */
function leggiBlocco(selettore: string): Record<string, string> {
  const inizio = css.indexOf(selettore);
  if (inizio < 0) throw new Error(`Selettore non trovato: ${selettore}`);
  const apertura = css.indexOf('{', inizio + selettore.length);
  const chiusura = css.indexOf('}', apertura);
  const corpo = css.slice(apertura + 1, chiusura);
  const valori: Record<string, string> = {};
  for (const [, nome = '', valore = ''] of corpo.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    valori[nome] = valore.trim();
  }
  return valori;
}

function luminanza(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const lineare = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lineare((n >> 16) & 255) + 0.7152 * lineare((n >> 8) & 255) + 0.0722 * lineare(n & 255);
}

function contrasto(a: string, b: string): number {
  const la = luminanza(a);
  const lb = luminanza(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const chiaro = leggiBlocco("[data-tema='chiaro']");
const scuro = leggiBlocco("[data-tema='scuro']");
const scuroAutomatico = leggiBlocco(":root:not([data-tema='chiaro'])");

const testi = ['testo', 'testo-2', 'azione-testo', 'cifre', 'conveniente', 'media', 'caro'];
const sfondi = ['sfondo', 'superficie'];

describe.each([
  ['chiaro', chiaro],
  ['scuro', scuro],
])('tema %s', (_nome, tema) => {
  for (const testo of testi) {
    for (const sfondo of sfondi) {
      it(`${testo} su ${sfondo} si legge (≥ 4,5:1)`, () => {
        expect(contrasto(colore(tema, testo), colore(tema, sfondo))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('il testo sul bottone principale si legge (≥ 4,5:1)', () => {
    expect(contrasto(colore(tema, 'su-azione'), colore(tema, 'azione'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('tema scuro', () => {
  it('quello automatico è identico a quello forzato', () => {
    expect(scuroAutomatico).toEqual(scuro);
  });
});
