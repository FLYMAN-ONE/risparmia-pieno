import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodifica, VERSIONE_FORMATO } from '../../condiviso/formato.ts';
import { FONTE, generaFile } from './genera.ts';
import { leggiAnagrafica, leggiPrezzi } from './leggi.ts';
import { controllaQualita, REGOLE } from './qualita.ts';
import { unisci } from './unisci.ts';

const campione = (nome: string) =>
  readFileSync(new URL(`../test/campioni/${nome}`, import.meta.url), 'utf8');

const a = leggiAnagrafica(campione('anagrafica_impianti_attivi.csv'));
const p = leggiPrezzi(campione('prezzo_alle_8.csv'));
const { distributori } = controllaQualita(a, p, unisci(a, p), {
  ...REGOLE,
  minimoDistributori: 0,
  minimoPrezzi: 0,
  massimoPrezziAssurdi: 1,
  massimoCoordinateFuori: 1,
});
const generato = new Date('2026-11-18T08:00:00Z');
const file = generaFile(distributori, '2026-11-17', generato);
// Il file passa per il testo JSON, come succede davvero tra cucina e telefono
const dati = decodifica(JSON.parse(JSON.stringify(file)));

describe('generaFile + decodifica (andata e ritorno sul campione)', () => {
  it('scrive intestazione, data e fonte', () => {
    expect(file.versione).toBe(VERSIONE_FORMATO);
    expect(dati.dataEstrazione).toBe('2026-11-17');
    expect(dati.generato).toBe('2026-11-18T08:00:00.000Z');
    expect(dati.fonte).toBe(FONTE);
  });

  it('non perde distributori né prezzi', () => {
    expect(dati.distributori).toHaveLength(distributori.length);
    const prezziIn = distributori.reduce((s, d) => s + d.prezzi.length, 0);
    const prezziOut = dati.distributori.reduce((s, d) => s + d.prezzi.length, 0);
    expect(prezziOut).toBe(prezziIn);
  });

  it('ritrova ogni campo di un distributore', () => {
    const prima = distributori.find((d) => d.id === 50432);
    const dopo = dati.distributori.find((d) => d.id === 50432);
    expect(dopo).toMatchObject({
      nome: prima?.nome,
      bandiera: 'Api-Ip',
      indirizzo: prima?.indirizzo,
      comune: { nome: 'ARQUATA SCRIVIA', provincia: 'AL' },
      autostradale: true,
    });
    expect(dopo?.lat).toBeCloseTo(prima?.lat ?? 0, 5);
    expect(dopo?.lon).toBeCloseTo(prima?.lon ?? 0, 5);
  });

  it('ritrova ogni prezzo con categoria, self, vecchio e giorno di comunicazione', () => {
    for (const prima of distributori) {
      const dopo = dati.distributori.find((d) => d.id === prima.id);
      expect(dopo?.prezzi).toEqual(
        prima.prezzi.map((x) => ({
          carburante: x.carburante,
          categoria: x.categoria,
          premium: x.premium,
          euro: x.euro,
          self: x.self,
          vecchio: x.vecchio,
          comunicato: x.comunicato.slice(0, 10),
        })),
      );
    }
  });

  it('crea l’indice dei comuni con il centro dei distributori', () => {
    const gallarate = dati.comuni.find((c) => c.nome === 'GALLARATE');
    const suoi = distributori.filter((d) => d.comune === 'GALLARATE');
    expect(gallarate?.provincia).toBe('VA');
    expect(gallarate?.lat).toBeCloseTo(suoi.reduce((s, d) => s + d.lat, 0) / suoi.length, 4);
    expect(dati.comuni.length).toBe(new Set(distributori.map((d) => `${d.comune}|${d.provincia}`)).size);
  });

  it('scrive i testi ripetuti una volta sola', () => {
    expect(new Set(file.bandiere).size).toBe(file.bandiere.length);
    expect(new Set(file.carburanti.map((c) => c[0])).size).toBe(file.carburanti.length);
  });
});

describe('decodifica', () => {
  it('rifiuta un file di una versione che non conosce', () => {
    expect(() => decodifica({ ...file, versione: 99 })).toThrow('versione 99');
  });
});
