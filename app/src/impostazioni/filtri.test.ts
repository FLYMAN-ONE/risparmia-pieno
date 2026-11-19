import { describe, expect, it } from 'vitest';
import { cambioDa, disegnaFiltri, disegnaRaggio, disegnaScelte, eUnFiltro, raggioDaPosizione, raggioDaTesto } from './filtri.ts';

const filtri = { carburante: 'gpl', modalita: 'tutte', raggioKm: 10 } as const;

describe('disegnaFiltri', () => {
  const html = disegnaFiltri(filtri);

  it('le pillole mostrano le scelte attuali', () => {
    expect([...html.matchAll(/class="valore">([^<]+)</g)].map((m) => m[1])).toEqual(['GPL', 'Self e servito']);
  });

  it('ogni pillola dice a VoiceOver e TalkBack quale filtro è', () => {
    expect([...html.matchAll(/class="solo-lettori">([^<]+)</g)].map((m) => m[1])).toEqual([
      'Carburante: ',
      'Self o servito: ',
    ]);
  });

  it('sono bottoni, non selettori nativi (che su iPhone si riaprivano da soli)', () => {
    expect(html).not.toContain('<select');
    expect(html.match(/<button/g)).toHaveLength(2);
  });
});

describe('disegnaRaggio', () => {
  const html = disegnaRaggio(10);

  it('slider a tre posizioni, sulla posizione del raggio scelto', () => {
    expect(html).toContain('min="0" max="2" step="1" value="1"');
    expect(html).toContain('aria-valuetext="10 km"');
  });

  it('sotto, le tre distanze decise; quella scelta è segnata', () => {
    expect([...html.matchAll(/class="tacca"[^>]*>([^<]+)</g)].map((m) => m[1])).toEqual(['5 km', '10 km', '15 km']);
    expect(html.match(/data-scelta/g)).toHaveLength(1);
    expect(html).toMatch(/data-raggio-km="10"[^>]*data-scelta/);
  });
});

describe('raggioDaPosizione e raggioDaTesto', () => {
  it('traducono posizione e testo nel raggio', () => {
    expect(raggioDaPosizione('0')).toBe(5);
    expect(raggioDaPosizione('2')).toBe(15);
    expect(raggioDaTesto('10')).toBe(10);
  });

  it('rifiutano valori strani', () => {
    expect(raggioDaPosizione('')).toBeUndefined();
    expect(raggioDaPosizione('3')).toBeUndefined();
    expect(raggioDaTesto('50')).toBeUndefined();
  });
});

describe('disegnaScelte', () => {
  it('segna solo la scelta attuale', () => {
    const html = disegnaScelte('modalita', filtri);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html).toMatch(/data-valore="tutte"\s+aria-checked="true"/);
  });

  it('i cinque carburanti', () => {
    const html = disegnaScelte('carburante', filtri);
    expect([...html.matchAll(/class="testo">([^<]+)</g)].map((m) => m[1])).toEqual(['Benzina', 'Gasolio', 'GPL', 'Metano', 'HVO']);
  });

  it('"Self e servito" spiega cosa significa', () => {
    expect(disegnaScelte('modalita', filtri)).toContain('Il prezzo più basso tra i due');
  });
});

describe('cambioDa', () => {
  it('legge il nuovo valore', () => {
    expect(cambioDa('raggioKm', '15')).toEqual({ filtro: 'raggioKm', valore: 15 });
    expect(cambioDa('carburante', 'metano')).toEqual({ filtro: 'carburante', valore: 'metano' });
    expect(cambioDa('modalita', 'servito')).toEqual({ filtro: 'modalita', valore: 'servito' });
  });

  it('rifiuta valori non previsti', () => {
    expect(cambioDa('carburante', 'kerosene')).toBeUndefined();
    expect(cambioDa('raggioKm', '50')).toBeUndefined();
    expect(cambioDa('colore', 'rosso')).toBeUndefined();
    expect(cambioDa(undefined, undefined)).toBeUndefined();
  });
});

describe('eUnFiltro', () => {
  it('riconosce solo i filtri con il menu', () => {
    expect(eUnFiltro('carburante')).toBe(true);
    expect(eUnFiltro('raggioKm')).toBe(false);
    expect(eUnFiltro('posizione')).toBe(false);
  });
});
