import { describe, expect, it } from 'vitest';
import { disegnaImpostazioni } from './pagina.ts';

const base = { tema: 'automatico', mappa: 'tema', versione: '0.1.0 del 19/11/2026' } as const;

describe('pagina Impostazioni e info', () => {
  it('segna le scelte attuali', () => {
    const html = disegnaImpostazioni({ ...base, tema: 'scuro', mappa: 'blu' });
    expect(html).toMatch(/value="scuro" checked/);
    expect(html).toMatch(/value="blu" checked/);
    expect(html.match(/checked/g)).toHaveLength(2);
  });
  it('tre temi e tre colori della mappa', () => {
    const html = disegnaImpostazioni(base);
    for (const testo of ['Automatico', 'Chiaro', 'Scuro', 'Come il tema', 'Chiara', 'Blu scura']) expect(html).toContain(testo);
  });
  it('fonte e licenza dei dati, attribuzione della mappa, privacy e versione', () => {
    const html = disegnaImpostazioni({ ...base, dataPrezzi: '2026-11-18' });
    expect(html).toContain('MIMIT');
    expect(html).toContain('IODL 2.0');
    expect(html).toContain('Prezzi del 18/11.');
    expect(html).toContain('© OpenStreetMap');
    expect(html).toContain('La tua posizione resta sul telefono');
    expect(html).toContain('0.1.0 del 19/11/2026');
  });
  it('nessun link esterno', () => {
    expect(disegnaImpostazioni(base)).not.toMatch(/href=|https:/); // (l'icona ha solo il suo xmlns, che non è un indirizzo da contattare)
  });
});
