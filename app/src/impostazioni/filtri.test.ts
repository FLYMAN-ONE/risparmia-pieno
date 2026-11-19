import { describe, expect, it } from 'vitest';
import { cambioDa, disegnaFiltri, disegnaScelte, eUnFiltro } from './filtri.ts';

const filtri = { carburante: 'gpl', modalita: 'tutte', raggioKm: 10 } as const;

describe('disegnaFiltri', () => {
  const html = disegnaFiltri(filtri);

  it('le pillole mostrano le scelte attuali', () => {
    expect([...html.matchAll(/class="valore">([^<]+)</g)].map((m) => m[1])).toEqual(['GPL', 'Self e servito', '10 km']);
  });

  it('ogni pillola dice a VoiceOver e TalkBack quale filtro è', () => {
    expect([...html.matchAll(/class="solo-lettori">([^<]+)</g)].map((m) => m[1])).toEqual([
      'Carburante: ',
      'Self o servito: ',
      'Raggio: ',
    ]);
  });

  it('sono bottoni, non selettori nativi (che su iPhone si riaprivano da soli)', () => {
    expect(html).not.toContain('<select');
    expect(html.match(/<button/g)).toHaveLength(3);
  });
});

describe('disegnaScelte', () => {
  it('offre solo i raggi decisi, con quello attuale segnato', () => {
    const html = disegnaScelte('raggioKm', filtri);
    expect([...html.matchAll(/class="testo">([^<]+)</g)].map((m) => m[1])).toEqual(['5 km', '10 km', '15 km']);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html).toMatch(/data-valore="10"\s+aria-checked="true"/);
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
  it('riconosce solo i tre filtri', () => {
    expect(eUnFiltro('raggioKm')).toBe(true);
    expect(eUnFiltro('posizione')).toBe(false);
  });
});
