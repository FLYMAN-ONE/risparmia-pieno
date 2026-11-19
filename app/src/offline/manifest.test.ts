// Il "biglietto da visita" dell'app installata (fase 7).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const leggi = (percorso: string) => readFileSync(new URL(percorso, import.meta.url), 'utf8');
const manifest = JSON.parse(leggi('../../public/manifest.webmanifest')) as Record<string, string>;
const token = leggi('../stile/token.css');

describe('manifest', () => {
  it("si apre come un'app, dentro il sito dell'app", () => {
    expect(manifest['display']).toBe('standalone');
    expect(manifest['start_url']).toBe('./');
    expect(manifest['scope']).toBe('./');
    expect(manifest['lang']).toBe('it');
  });
  it('i colori sono quelli del file dei token (sfondo asfalto)', () => {
    for (const campo of ['background_color', 'theme_color']) {
      expect(token).toContain(`--sfondo: ${manifest[campo] ?? ''};`);
    }
  });
  it('nessun indirizzo esterno', () => {
    expect(JSON.stringify(manifest)).not.toMatch(/https?:/);
  });
  it('la pagina lo collega', () => {
    expect(leggi('../../index.html')).toContain('<link rel="manifest" href="./manifest.webmanifest" />');
  });
});
