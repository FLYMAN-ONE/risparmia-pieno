import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chiediPosizione } from './posizione.ts';

/** Un finto GPS che risponde come vogliamo noi. */
function gpsFinto(risposta: { lat: number; lon: number } | { codice: number }): Geolocation {
  return {
    getCurrentPosition(riuscito, fallito) {
      if ('codice' in risposta) {
        fallito?.({ code: risposta.codice, message: '' } as GeolocationPositionError);
      } else {
        riuscito({ coords: { latitude: risposta.lat, longitude: risposta.lon } } as GeolocationPosition);
      }
    },
  } as Geolocation;
}

describe('chiediPosizione', () => {
  it('restituisce latitudine e longitudine', async () => {
    expect(await chiediPosizione(gpsFinto({ lat: 45.66, lon: 8.79 }))).toEqual({
      tipo: 'ok',
      posizione: { lat: 45.66, lon: 8.79 },
    });
  });

  it('permesso negato → "negata"', async () => {
    expect(await chiediPosizione(gpsFinto({ codice: 1 }))).toEqual({ tipo: 'negata', codice: 1 });
  });

  it('GPS che non risponde o tempo scaduto → "non-disponibile"', async () => {
    expect(await chiediPosizione(gpsFinto({ codice: 2 }))).toEqual({ tipo: 'non-disponibile', codice: 2 });
    expect(await chiediPosizione(gpsFinto({ codice: 3 }))).toEqual({ tipo: 'non-disponibile', codice: 3 });
  });

  it('telefono o browser senza GPS → "non-disponibile"', async () => {
    expect(await chiediPosizione(undefined)).toEqual({ tipo: 'non-disponibile', codice: 0 });
  });
});

describe('privacy della posizione', () => {
  const cartella = new URL('./', import.meta.url);
  const sorgenti = readdirSync(cartella)
    .filter((nome) => nome.endsWith('.ts') && !nome.endsWith('.test.ts'))
    .map((nome) => readFileSync(new URL(nome, cartella), 'utf8'));

  it('il modulo non salva, non registra e non invia nulla', () => {
    const vietati = ['localStorage', 'sessionStorage', 'indexedDB', 'caches', 'document.cookie', 'console.', 'fetch(', 'sendBeacon', 'XMLHttpRequest', 'watchPosition'];
    for (const codice of sorgenti) {
      for (const parola of vietati) expect(codice).not.toContain(parola);
    }
  });
});
