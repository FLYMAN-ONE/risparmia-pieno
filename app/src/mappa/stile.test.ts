import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { aspettoMappa, confiniRaggio, DOMINIO_TESSERE, richiestaSicura, STILI } from './stile.ts';
import { distanzaKm } from '../vicini/distanza.ts';

describe('stile della mappa', () => {
  it('usa solo OpenFreeMap, chiaro e scuro', () => {
    expect(STILI.chiaro).toBe('https://tiles.openfreemap.org/styles/positron');
    expect(STILI.scuro).toBe('https://tiles.openfreemap.org/styles/dark');
  });

  it('ogni richiesta parte senza referrer', () => {
    expect(richiestaSicura('https://tiles.openfreemap.org/planet/1/2/3.pbf')).toEqual({
      url: 'https://tiles.openfreemap.org/planet/1/2/3.pbf',
      referrerPolicy: 'no-referrer',
    });
  });

  it('blocca le richieste verso altri domini', () => {
    expect(richiestaSicura('https://altro.example/tessera.png').url).toBe('about:blank');
    expect(richiestaSicura('https://tiles.openfreemap.org.altro.example/x').url).toBe('about:blank');
  });
});

describe('confiniRaggio', () => {
  it('il riquadro contiene il cerchio del raggio', () => {
    const centro = { lat: 45.66, lon: 8.79 };
    const [[ovest, sud], [est, nord]] = confiniRaggio(centro, 5);
    expect(distanzaKm(centro, { lat: nord, lon: centro.lon })).toBeCloseTo(5, 1);
    expect(distanzaKm(centro, { lat: centro.lat, lon: est })).toBeCloseTo(5, 1);
    expect(sud).toBeLessThan(centro.lat);
    expect(ovest).toBeLessThan(centro.lon);
  });
});

describe('modulo della mappa', () => {
  const codice = readFileSync(new URL('./mappa.ts', import.meta.url), 'utf8');

  it('passa ogni richiesta da richiestaSicura', () => {
    expect(codice).toContain('transformRequest: richiestaSicura');
  });

  it('indica a MapLibre il suo worker incluso nell\'app (senza, nel sito pubblicato la mappa resta vuota)', () => {
    expect(codice).toContain("from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'");
    expect(codice).toContain('setWorkerUrl(');
  });

  it('non salva e non registra la posizione', () => {
    expect(codice).not.toMatch(/localStorage|sessionStorage|indexedDB|console\.|fetch\(/);
  });
});

describe('aspettoMappa', () => {
  it('come il tema: chiara o scura insieme all’app, attenuata', () => {
    expect(aspettoMappa('tema', false)).toEqual({ url: STILI.chiaro, attenuata: true, scura: false });
    expect(aspettoMappa('tema', true)).toEqual({ url: STILI.scuro, attenuata: true, scura: true });
  });
  it('chiara: Bright attenuata, anche con l’app scura', () => {
    expect(aspettoMappa('chiara', true)).toEqual({ url: STILI.bright, attenuata: true, scura: false });
  });
  it('blu scura: Fiord con i suoi colori', () => {
    expect(aspettoMappa('blu', false)).toEqual({ url: STILI.fiord, attenuata: false, scura: true });
  });
  it('tutti gli stili vengono da OpenFreeMap', () => {
    for (const url of Object.values(STILI)) expect(url.startsWith(DOMINIO_TESSERE)).toBe(true);
  });
});
