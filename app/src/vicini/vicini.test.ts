import { describe, expect, it } from 'vitest';
import { distanzaKm } from './distanza.ts';
import { entroRaggio, spostamentoSignificativo } from './vicini.ts';

const centro = { lat: 45.66, lon: 8.79 }; // Gallarate

/** Un punto a `km` chilometri dal centro, verso nord (n) o verso est (e). */
function a(km: number, verso: 'n' | 'e', nome: string) {
  if (verso === 'n') return { nome, lat: centro.lat + km / 111.19, lon: centro.lon };
  return { nome, lat: centro.lat, lon: centro.lon + km / (111.19 * Math.cos((centro.lat * Math.PI) / 180)) };
}

describe('entroRaggio', () => {
  const distributori = [a(7, 'n', 'nord 7'), a(1, 'e', 'est 1'), a(4.9, 'n', 'nord 4,9'), a(5.2, 'e', 'est 5,2'), a(0, 'n', 'qui')];

  it('tiene solo chi è dentro il raggio, dal più vicino', () => {
    const vicini = entroRaggio(distributori, centro, 5);
    expect(vicini.map((v) => v.distributore.nome)).toEqual(['qui', 'est 1', 'nord 4,9']);
  });

  it('allargando il raggio ne trova di più', () => {
    expect(entroRaggio(distributori, centro, 10)).toHaveLength(5);
  });

  it('riporta la distanza di ciascuno', () => {
    const [primo, secondo] = entroRaggio(distributori, centro, 5);
    expect(primo?.km).toBe(0);
    expect(secondo?.km).toBeCloseTo(1, 2);
  });

  it('il bordo del raggio è compreso', () => {
    const sulBordo = { nome: 'bordo', lat: 45.7, lon: 8.83 };
    const km = distanzaKm(centro, sulBordo);
    expect(entroRaggio([sulBordo], centro, km)).toHaveLength(1);
  });

  it('il filtro veloce non perde nessuno: stesso risultato del calcolo completo', () => {
    // 2.000 punti sparsi a caso (ma sempre uguali) entro circa 30 km
    let seme = 42;
    const caso = () => ((seme = (seme * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const punti = Array.from({ length: 2000 }, (_, i) => ({ nome: String(i), lat: centro.lat + caso() * 0.3, lon: centro.lon + caso() * 0.4 }));
    for (const raggio of [5, 10, 15]) {
      const attesi = punti.filter((p) => distanzaKm(centro, p) <= raggio).length;
      expect(entroRaggio(punti, centro, raggio)).toHaveLength(attesi);
    }
  });

  it('senza distributori vicini restituisce un elenco vuoto', () => {
    expect(entroRaggio([a(50, 'n', 'lontano')], centro, 15)).toEqual([]);
  });
});

describe('spostamentoSignificativo', () => {
  const gallarate = { lat: 45.66, lon: 8.79 };
  // 0,01 gradi di latitudine sono circa 1,1 km
  it('un piccolo ritocco della mappa non ricalcola i prezzi', () => {
    expect(spostamentoSignificativo(gallarate, { lat: 45.665, lon: 8.79 }, 5)).toBe(false);
  });
  it('uno spostamento di almeno un quinto del raggio sì', () => {
    expect(spostamentoSignificativo(gallarate, { lat: 45.67, lon: 8.79 }, 5)).toBe(true);
    expect(spostamentoSignificativo(gallarate, { lat: 45.67, lon: 8.79 }, 15)).toBe(false);
  });
});
