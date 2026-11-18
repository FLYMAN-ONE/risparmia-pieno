import { describe, expect, it } from 'vitest';
import { scaricaTesto } from './scarica.ts';

/** Finto server: risponde sempre con il testo e il codice indicati. */
function fintoServer(testo: string, codice: number): typeof fetch {
  return async () => new Response(testo, { status: codice });
}

describe('scaricaTesto', () => {
  it('restituisce il contenuto del file quando il server risponde bene', async () => {
    const testo = await scaricaTesto('https://esempio.it/f.csv', fintoServer('a|b\n1|2', 200));
    expect(testo).toBe('a|b\n1|2');
  });

  it('si ferma con un messaggio chiaro se il server risponde con un errore', async () => {
    await expect(
      scaricaTesto('https://esempio.it/f.csv', fintoServer('', 404)),
    ).rejects.toThrow('Download fallito: il server ha risposto 404');
  });
});
