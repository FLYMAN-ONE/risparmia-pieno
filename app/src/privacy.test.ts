// Regola privacy 8: la vista Lista non contatta nessun dominio esterno.
// La mappa (unica a usare un dominio esterno, OpenFreeMap) si scarica solo al tocco di "Mappa".
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const radice = new URL('.', import.meta.url).pathname;

function fileDiCodice(cartella: string): string[] {
  return readdirSync(cartella).flatMap((nome) => {
    const percorso = join(cartella, nome);
    if (statSync(percorso).isDirectory()) return fileDiCodice(percorso);
    return /\.ts$/.test(nome) && !/\.test\.ts$/.test(nome) ? [percorso] : [];
  });
}

const codice = fileDiCodice(radice).map((percorso) => ({
  file: percorso.slice(radice.length),
  testo: readFileSync(percorso, 'utf8'),
}));

describe('la lista non contatta domini esterni', () => {
  it('MapLibre si importa solo nel modulo della mappa', () => {
    const conMapLibre = codice.filter(({ testo }) => /from 'maplibre-gl/.test(testo)).map(({ file }) => file);
    expect(conMapLibre).toEqual(['mappa/mappa.ts']);
  });

  it('il modulo della mappa si carica solo al bisogno (import dinamico), mai all\'avvio', () => {
    const statici = codice.filter(({ testo }) => /^import (?!type)[^;]*from '\.\/mappa\/mappa\.ts'/m.test(testo));
    expect(statici).toEqual([]);
    expect(codice.find(({ file }) => file === 'main.ts')?.testo).toContain("import('./mappa/mappa.ts')");
  });

  it('nessun indirizzo esterno nel codice, tranne le tessere OpenFreeMap e i link di Naviga', () => {
    const consentiti = ['https://tiles.openfreemap.org/', 'https://maps.apple.com/', 'https://www.google.com/maps/'];
    const trovati = codice.flatMap(({ file, testo }) =>
      [...testo.matchAll(/https?:\/\/[^\s'"`)]+/g)].map((m) => ({ file, url: m[0] })),
    );
    const estranei = trovati.filter(({ url }) => !consentiti.some((c) => url.startsWith(c)));
    expect(estranei).toEqual([]);
  });
});
