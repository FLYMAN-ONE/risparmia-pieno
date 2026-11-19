import { describe, expect, it } from 'vitest';
import { distanzaKm } from './distanza.ts';

const duomoMilano = { lat: 45.4642, lon: 9.19 };
const colosseo = { lat: 41.8902, lon: 12.4922 };

describe('distanzaKm', () => {
  it('lo stesso punto è a 0 km', () => {
    expect(distanzaKm(duomoMilano, duomoMilano)).toBe(0);
  });

  it('un grado di latitudine vale circa 111,2 km', () => {
    expect(distanzaKm({ lat: 45, lon: 9 }, { lat: 46, lon: 9 })).toBeCloseTo(111.19, 1);
  });

  it('un grado di longitudine vale meno al nord: a 45° circa 78,6 km', () => {
    expect(distanzaKm({ lat: 45, lon: 9 }, { lat: 45, lon: 10 })).toBeCloseTo(78.6, 0);
  });

  it('Milano Duomo – Roma Colosseo: circa 477 km in linea d\'aria', () => {
    expect(distanzaKm(duomoMilano, colosseo)).toBeGreaterThan(476);
    expect(distanzaKm(duomoMilano, colosseo)).toBeLessThan(478);
  });

  it('andata e ritorno sono uguali', () => {
    expect(distanzaKm(duomoMilano, colosseo)).toBe(distanzaKm(colosseo, duomoMilano));
  });

  it('le piccole distanze sono precise: 0,001° di latitudine ≈ 111 m', () => {
    expect(distanzaKm({ lat: 45.66, lon: 8.79 }, { lat: 45.661, lon: 8.79 })).toBeCloseTo(0.111, 3);
  });
});
