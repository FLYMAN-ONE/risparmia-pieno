import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { leggiAnagrafica, leggiPrezzi } from './leggi.ts';
import { unisci } from './unisci.ts';

const campione = (nome: string) =>
  readFileSync(new URL(`../test/campioni/${nome}`, import.meta.url), 'utf8');

describe('unisci sul campione reale', () => {
  const anagrafica = leggiAnagrafica(campione('anagrafica_impianti_attivi.csv'));
  const prezzi = leggiPrezzi(campione('prezzo_alle_8.csv'));
  const unione = unisci(anagrafica, prezzi);

  it('tiene i 25 distributori con prezzi ed esclude i 3 senza', () => {
    expect(unione.distributori).toHaveLength(25);
    expect(unione.senzaPrezzi).toBe(3);
    for (const id of [7842, 10555, 48492]) {
      expect(unione.distributori.some((d) => d.id === id)).toBe(false);
    }
    expect(unione.prezziOrfani).toBe(0);
  });

  it('assegna a ogni distributore tutti e soli i suoi prezzi', () => {
    const totale = unione.distributori.reduce((somma, d) => somma + d.prezzi.length, 0);
    expect(totale).toBe(125);
    const d = unione.distributori.find((x) => x.id === 60012);
    expect(d?.prezzi.every((p) => p.carburante === 'Hi-Q Diesel' || p.euro < 5)).toBe(true);
  });

  it('aggiunge la categoria e tiene il nome originale', () => {
    const d = unione.distributori.find((x) => x.id === 59183);
    expect(d?.prezzi).toContainEqual(
      expect.objectContaining({ carburante: 'HVOlution', categoria: 'hvo', premium: false }),
    );
    expect(unione.carburantiSconosciuti).toEqual({});
  });
});

describe('unisci con dati inventati', () => {
  const testata = (data: string, intestazione: string) => `Estrazione del ${data}\n${intestazione}\n`;
  const ANAG = 'idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine';
  const PREZ = 'idImpianto|descCarburante|prezzo|isSelf|dtComu';
  const anagrafica = leggiAnagrafica(testata('2026-11-17', ANAG) + '1|G|Q8|Stradale|N|Via 1|Roma|RM|41.9|12.5');

  it('conta i prezzi di distributori sconosciuti', () => {
    const prezzi = leggiPrezzi(
      testata('2026-11-17', PREZ) + '1|Benzina|1.8|1|01/01/2026 08:00:00\n99|GPL|0.7|0|01/01/2026 08:00:00',
    );
    const unione = unisci(anagrafica, prezzi);
    expect(unione.distributori[0]?.prezzi).toHaveLength(1);
    expect(unione.prezziOrfani).toBe(1);
  });

  it('segnala i carburanti sconosciuti', () => {
    const prezzi = leggiPrezzi(
      testata('2026-11-17', PREZ) +
        '1|Idrogeno|9.9|1|01/01/2026 08:00:00\n1|Idrogeno|9.8|0|01/01/2026 08:00:00',
    );
    const unione = unisci(anagrafica, prezzi);
    expect(unione.carburantiSconosciuti).toEqual({ Idrogeno: 2 });
    expect(unione.distributori[0]?.prezzi[0]?.categoria).toBe('altro');
  });

  it('si ferma se i due file sono di giorni diversi', () => {
    const prezzi = leggiPrezzi(testata('2026-11-16', PREZ) + '1|Benzina|1.8|1|01/01/2026 08:00:00');
    expect(() => unisci(anagrafica, prezzi)).toThrow('giorni diversi');
  });
});
