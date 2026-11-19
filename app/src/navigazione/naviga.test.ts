import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { appMappeDi, linkNavigazione } from './naviga.ts';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/19.0 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36';

describe('appMappeDi', () => {
  it('Mappe di Apple su iPhone e iPad, Google Maps su Android', () => {
    expect(appMappeDi(IPHONE)).toBe('apple');
    expect(appMappeDi(IPAD)).toBe('apple');
    expect(appMappeDi(ANDROID)).toBe('google');
  });
});

describe('linkNavigazione', () => {
  it('apre la navigazione in auto verso il distributore', () => {
    expect(linkNavigazione(45.66, 8.79, 'apple')).toBe('https://maps.apple.com/?daddr=45.660000,8.790000&dirflg=d');
    expect(linkNavigazione(45.66, 8.79, 'google')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=45.660000,8.790000&travelmode=driving',
    );
  });

  it('nel link c\'è solo la destinazione, mai un punto di partenza', () => {
    for (const app of ['apple', 'google'] as const) {
      const link = linkNavigazione(45.66, 8.79, app);
      expect(link).not.toMatch(/saddr|origin/);
    }
  });

  it('il modulo non legge la posizione né contatta nessuno', () => {
    const codice = readFileSync(new URL('./naviga.ts', import.meta.url), 'utf8');
    expect(codice).not.toMatch(/geolocation|fetch\(|localStorage|console\./);
  });
});
