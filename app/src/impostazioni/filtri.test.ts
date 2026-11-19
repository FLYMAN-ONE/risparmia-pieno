import { describe, expect, it } from 'vitest';
import { cambioDa, disegnaFiltri } from './filtri.ts';

const html = disegnaFiltri({ carburante: 'gpl', modalita: 'tutte', raggioKm: 10 });

/** Un finto selettore, con solo ciò che serve a cambioDa. */
const selettore = (filtro: string, value: string) => ({ value, dataset: { filtro } }) as unknown as HTMLSelectElement;

describe('disegnaFiltri', () => {
  it('mostra le scelte attuali', () => {
    expect(html).toContain('<option value="gpl" selected>GPL</option>');
    expect(html).toContain('<option value="tutte" selected>Self e servito</option>');
    expect(html).toContain('<option value="10" selected>10 km</option>');
    expect(html.match(/ selected/g)).toHaveLength(3);
  });

  it('offre solo i raggi decisi: 5, 10 e 15 km', () => {
    expect([...html.matchAll(/<option[^>]*>(\d+ km)</g)].map((m) => m[1])).toEqual(['5 km', '10 km', '15 km']);
  });

  it('la pillola mostra il testo della scelta attuale', () => {
    expect([...html.matchAll(/class="valore"[^>]*>([^<]+)</g)].map((m) => m[1])).toEqual(['GPL', 'Self e servito', '10 km']);
  });

  it('ogni filtro ha un nome per VoiceOver e TalkBack', () => {
    expect([...html.matchAll(/class="solo-lettori">([^<]+)</g)].map((m) => m[1])).toEqual([
      'Carburante',
      'Self o servito',
      'Raggio',
    ]);
  });
});

describe('cambioDa', () => {
  it('legge il nuovo valore', () => {
    expect(cambioDa(selettore('raggioKm', '15'))).toEqual({ filtro: 'raggioKm', valore: 15 });
    expect(cambioDa(selettore('carburante', 'metano'))).toEqual({ filtro: 'carburante', valore: 'metano' });
    expect(cambioDa(selettore('modalita', 'servito'))).toEqual({ filtro: 'modalita', valore: 'servito' });
  });

  it('rifiuta valori non previsti', () => {
    expect(cambioDa(selettore('carburante', 'kerosene'))).toBeUndefined();
    expect(cambioDa(selettore('raggioKm', '50'))).toBeUndefined();
    expect(cambioDa(selettore('colore', 'rosso'))).toBeUndefined();
  });
});
