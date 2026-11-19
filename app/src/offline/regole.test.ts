import { describe, expect, it } from 'vitest';
import { cacheDaTogliere, fileDaPrecaricare, prezziCambiati, tipoDiRichiesta } from './regole.ts';

const radice = new URL('https://flyman-one.github.io/risparmia-pieno/');
const tipo = (indirizzo: string, navigazione = false) => tipoDiRichiesta(new URL(indirizzo, radice), radice, navigazione);

describe('tipoDiRichiesta', () => {
  it("la pagina dell'app, anche con ?v=12", () => {
    expect(tipo('./', true)).toBe('pagina');
    expect(tipo('./?v=12', true)).toBe('pagina');
    expect(tipo('./index.html', true)).toBe('pagina');
  });
  it('il file dei prezzi e i file dell’app', () => {
    expect(tipo('./dati/prezzi.json')).toBe('prezzi');
    expect(tipo('./assets/index-BUqAJoKS.js')).toBe('file');
    expect(tipo('./assets/TitilliumWeb-Bold-BOkWz9TL.ttf')).toBe('file');
  });
  it('le tessere della mappa non si toccano e non si conservano (privacy)', () => {
    expect(tipo('https://tiles.openfreemap.org/planet/20261118/14/8590/5880.pbf')).toBe('ignora');
    expect(tipo('https://tiles.openfreemap.org/styles/dark')).toBe('ignora');
  });
  it('altre pagine o siti dello stesso dominio no', () => {
    expect(tipo('https://flyman-one.github.io/altro-progetto/', true)).toBe('ignora');
    expect(tipo('./campionario/', true)).toBe('ignora');
    expect(tipo('./sw.js')).toBe('ignora');
  });
});

describe('fileDaPrecaricare', () => {
  it('la pagina, il codice, lo stile e i font; non i prezzi, il custode e la mappa', () => {
    const costruiti = [
      'index.html',
      'sw.js',
      'dati/prezzi.json',
      'assets/index-BUqAJoKS.js',
      'assets/index-B3AwzsOb.css',
      'assets/mappa-DRU7gzke.js',
      'assets/mappa-qvkd0SPb.css',
      'assets/maplibre-gl-worker-BZdkatZW.mjs',
      'assets/TitilliumWeb-Bold-BOkWz9TL.ttf',
    ];
    expect(fileDaPrecaricare(costruiti)).toEqual([
      'assets/TitilliumWeb-Bold-BOkWz9TL.ttf',
      'assets/index-B3AwzsOb.css',
      'assets/index-BUqAJoKS.js',
      'index.html',
    ]);
  });
});

describe('cacheDaTogliere', () => {
  it('tiene la versione attuale e quella prima, butta le più vecchie', () => {
    expect(cacheDaTogliere(['prezzi', 'app-a', 'app-b', 'app-c'], 'app-c')).toEqual(['app-a']);
    expect(cacheDaTogliere(['prezzi', 'app-b', 'app-c'], 'app-c')).toEqual([]);
    expect(cacheDaTogliere(['app-c'], 'app-c')).toEqual([]);
  });
  it('il cassetto dei prezzi non si butta mai', () => {
    expect(cacheDaTogliere(['prezzi', 'app-a', 'app-b', 'app-c', 'app-d'], 'app-d')).toEqual(['app-a', 'app-b']);
  });
});

describe('prezziCambiati', () => {
  const h = (valori: Record<string, string>) => new Headers(valori);
  it('impronta diversa: file nuovo', () => {
    expect(prezziCambiati(h({ etag: '"a"' }), h({ etag: '"b"' }))).toBe(true);
    expect(prezziCambiati(h({ etag: '"a"' }), h({ etag: '"a"' }))).toBe(false);
  });
  it('senza impronta conta la data di modifica', () => {
    const lunedi = 'Mon, 16 Nov 2026 08:00:00 GMT';
    expect(prezziCambiati(h({ 'last-modified': lunedi }), h({ 'last-modified': 'Tue, 17 Nov 2026 08:00:00 GMT' }))).toBe(true);
    expect(prezziCambiati(h({ 'last-modified': lunedi }), h({ 'last-modified': lunedi }))).toBe(false);
  });
  it('se il sito non dice nulla, non si può sapere: niente avviso', () => {
    expect(prezziCambiati(h({}), h({}))).toBe(false);
  });
});
