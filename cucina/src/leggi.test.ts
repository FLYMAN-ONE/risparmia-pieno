import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { leggiAnagrafica, leggiPrezzi, pulisciTesto } from './leggi.ts';

const campione = (nome: string) =>
  readFileSync(new URL(`../test/campioni/${nome}`, import.meta.url), 'utf8');

const anagrafica = leggiAnagrafica(campione('anagrafica_impianti_attivi.csv'));
const prezzi = leggiPrezzi(campione('prezzo_alle_8.csv'));
const impianto = (id: number) => anagrafica.righe.find((i) => i.id === id);

describe('leggiAnagrafica sul campione reale', () => {
  it('legge la data di estrazione', () => {
    expect(anagrafica.dataEstrazione).toBe('2026-11-17');
  });

  it('legge tutti i 28 distributori senza scartarne nessuno', () => {
    expect(anagrafica.righe).toHaveLength(28);
    expect(anagrafica.scartate).toEqual([]);
  });

  it('legge una riga normale', () => {
    expect(impianto(50432)).toEqual({
      id: 50432,
      bandiera: 'Api-Ip',
      tipo: 'Autostradale',
      nome: 'VALLE SCRIVIA OVEST',
      indirizzo: 'A7 SERRAVALLE-GENOVA, Km. 92, MI-GE - 15061',
      comune: 'ARQUATA SCRIVIA',
      provincia: 'AL',
      lat: 44.670344360385094,
      lon: 8.90593576811705,
    });
  });

  it('gestisce il separatore dentro il nome (11 campi)', () => {
    expect(impianto(23316)).toMatchObject({
      bandiera: 'Pompe Bianche',
      tipo: 'Stradale',
      nome: 'SANTORO PETROLI - FIUMARA | gestori.prezzibenzina.it',
      comune: 'CARIFE',
      provincia: 'AV',
    });
  });

  it('gestisce il separatore dentro gestore e nome (12 campi)', () => {
    expect(impianto(40820)).toMatchObject({
      bandiera: 'Pompe Bianche',
      nome: 'STOIL SIMPLE | gestori.prezzibenzina.it',
      indirizzo: 'STR. PROV.LE 82 SPINETTA SALE 15122',
      comune: 'ALESSANDRIA',
    });
  });

  it('non si confonde con le virgolette spaiate', () => {
    expect(impianto(46593)).toMatchObject({ bandiera: 'Q8', comune: 'CAMPOBELLO DI LICATA' });
  });

  it('toglie tab e spazi doppi', () => {
    expect(impianto(63381)?.nome).toBe('19834 MONTALLEGRO');
    expect(impianto(63381)?.indirizzo).toBe('SS.115 KM.158+302 S.N.');
  });

  it('segna come null le coordinate mancanti', () => {
    expect(impianto(60502)).toMatchObject({ lat: null, lon: null, nome: '' });
  });
});

describe('leggiPrezzi sul campione reale', () => {
  it('legge tutti i 125 prezzi', () => {
    expect(prezzi.dataEstrazione).toBe('2026-11-17');
    expect(prezzi.righe).toHaveLength(125);
    expect(prezzi.scartate).toEqual([]);
  });

  it('converte prezzo, self e data', () => {
    expect(prezzi.righe.find((p) => p.idImpianto === 6471 && p.carburante === 'Hi-Q Diesel')).toEqual({
      idImpianto: 6471,
      carburante: 'Hi-Q Diesel',
      euro: 1.698,
      self: true,
      comunicato: '2013-07-22T12:34:55',
    });
  });

  it('legge anche i prezzi assurdi: scartarli è compito dei controlli di qualità', () => {
    const euro = prezzi.righe.map((p) => p.euro);
    expect(euro).toContain(0.1);
    expect(euro).toContain(8.888);
  });
});

describe('file con problemi', () => {
  const dati = '\nidImpianto|descCarburante|prezzo|isSelf|dtComu\n1|Benzina|1.8|1|01/01/2026 08:00:00';

  it('si ferma se manca la data di estrazione', () => {
    expect(() => leggiPrezzi(dati)).toThrow('Prima riga inattesa');
  });

  it('si ferma se le colonne sono cambiate', () => {
    expect(() => leggiPrezzi('Estrazione del 2026-11-17\nid;carburante;prezzo')).toThrow(
      'Intestazione cambiata',
    );
  });

  it('accetta anche gli "a capo" di Windows', () => {
    const testo = `Estrazione del 2026-11-17\r${dati.replaceAll('\n', '\r\n')}\r\n`;
    expect(leggiPrezzi(testo).righe).toHaveLength(1);
  });

  it('scarta le righe difettose indicando numero e motivo', () => {
    const testo =
      'Estrazione del 2026-11-17\nidImpianto|descCarburante|prezzo|isSelf|dtComu\n' +
      '1|Benzina|1.8|1|01/01/2026 08:00:00\n' +
      'x|Benzina|1.8|1|01/01/2026 08:00:00\n' +
      '2|Benzina|abc|1|01/01/2026 08:00:00\n' +
      '3|Benzina|1.8|2|01/01/2026 08:00:00\n' +
      '4|Benzina|1.8|1|2026-01-01\n' +
      '5|Benzina|1.8|1';
    const letto = leggiPrezzi(testo);
    expect(letto.righe).toHaveLength(1);
    expect(letto.scartate.map((s) => s.numero)).toEqual([4, 5, 6, 7, 8]);
    expect(letto.scartate[4]?.motivo).toBe('4 campi invece di 5');
  });

  it("scarta un distributore se non trova il tipo d'impianto", () => {
    const testo =
      'Estrazione del 2026-11-17\nidImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine\n' +
      '1|G|B|Sconosciuto|N|Via 1|Roma|RM|41.9|12.5';
    expect(leggiAnagrafica(testo).scartate[0]?.motivo).toBe('tipo impianto non riconosciuto');
  });
});

describe('pulisciTesto', () => {
  it('toglie virgolette ai bordi, anche spaiate', () => {
    expect(pulisciTesto('"IP SERVICES S.R.L."')).toBe('IP SERVICES S.R.L.');
    expect(pulisciTesto('"MEGA SERVICE')).toBe('MEGA SERVICE');
  });

  it('lascia le virgolette interne', () => {
    expect(pulisciTesto('FORMA ABBREVIATA "SEPA S.R.L."')).toBe('FORMA ABBREVIATA "SEPA S.R.L.');
  });
});
