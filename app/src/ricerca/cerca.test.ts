import { describe, expect, it } from 'vitest';
import type { Comune } from '../../../condiviso/formato.ts';
import { cercaComuni, errori, normalizza } from './cerca.ts';

const c = (nome: string, provincia = 'VA'): Comune => ({ nome, provincia, lat: 45, lon: 9 });
const COMUNI = [
  c('GALLARATE'),
  c('GALLIATE', 'NO'),
  c('CARDANO AL CAMPO'),
  c('BUSTO ARSIZIO'),
  c('SAN DONATO MILANESE', 'MI'),
  c("SANT'ANGELO LODIGIANO", 'LO'),
  c('ANTEY-SAINT-ANDRÉ', 'AO'),
  c('MILANO', 'MI'),
  c('CORNAREDO', 'MI'),
  c('ROMA', 'RM'),
];
const nomi = (testo: string) => cercaComuni(COMUNI, testo).map((x) => x.nome);

describe('normalizza', () => {
  it('toglie accenti, maiuscole, apostrofi e trattini', () => {
    expect(normalizza("SANT'ANGELO")).toBe('sant angelo');
    expect(normalizza('Antey-Saint-André')).toBe('antey saint andre');
    expect(normalizza('  Busto   Arsizio ')).toBe('busto arsizio');
  });
});

describe('errori', () => {
  it('conta lettere sbagliate, mancanti, in più e scambiate', () => {
    expect(errori('gallarate', 'gallarate', 2)).toBe(0);
    expect(errori('galarate', 'gallarate', 2)).toBe(1);
    expect(errori('gallaraet', 'gallarate', 2)).toBe(1);
    expect(errori('gellarate', 'gallarate', 2)).toBe(1);
  });

  it('si ferma oltre il massimo', () => {
    expect(errori('roma', 'gallarate', 1)).toBe(2);
  });
});

describe('cercaComuni', () => {
  it('"gallarate" trova Gallarate per primo', () => {
    expect(nomi('gallarate')[0]).toBe('GALLARATE');
  });

  it('mentre scrivi: i nomi che iniziano così', () => {
    expect(nomi('gall')).toEqual(['GALLIATE', 'GALLARATE']);
  });

  it('senza accenti e apostrofi', () => {
    expect(nomi('antey saint andre')).toEqual(['ANTEY-SAINT-ANDRÉ']);
    expect(nomi("sant'angelo")[0]).toBe("SANT'ANGELO LODIGIANO");
    expect(nomi('santangelo')[0]).toBe("SANT'ANGELO LODIGIANO");
  });

  it('anche una parola in mezzo al nome', () => {
    expect(nomi('arsizio')).toEqual(['BUSTO ARSIZIO']);
    expect(nomi('donato')).toEqual(['SAN DONATO MILANESE']);
  });

  it('tollera gli errori di battitura', () => {
    expect(nomi('galarate')[0]).toBe('GALLARATE');
    expect(nomi('gallarte')[0]).toBe('GALLARATE');
    expect(nomi('bsuto arsizio')[0]).toBe('BUSTO ARSIZIO');
  });

  it('da 4 lettere un errore è tollerato; sotto le 4 nessuno (troppi falsi suggerimenti)', () => {
    expect(nomi('roma')).toEqual(['ROMA']);
    expect(nomi('rona')).toEqual(['ROMA']);
    expect(nomi('rmo')).toEqual([]);
  });

  it('meno di 2 lettere: nessun suggerimento', () => {
    expect(nomi('g')).toEqual([]);
    expect(nomi('')).toEqual([]);
  });

  it('a parità, prima il comune più importante (con più distributori)', () => {
    const peso = (x: Comune) => (x.nome === 'GALLARATE' ? 30 : 2);
    expect(cercaComuni(COMUNI, 'gall', peso).map((x) => x.nome)).toEqual(['GALLARATE', 'GALLIATE']);
  });

  it('al massimo 8 suggerimenti', () => {
    const tanti = Array.from({ length: 20 }, (_, i) => c(`PAESE ${String(i)}`));
    expect(cercaComuni(tanti, 'paese')).toHaveLength(8);
  });
});
