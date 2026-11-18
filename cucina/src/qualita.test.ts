import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { leggiAnagrafica, leggiPrezzi } from './leggi.ts';
import { controllaQualita, giorniTrascorsi, mediana, REGOLE, type Regole } from './qualita.ts';
import { unisci } from './unisci.ts';

const campione = (nome: string) =>
  readFileSync(new URL(`../test/campioni/${nome}`, import.meta.url), 'utf8');

/** Il campione è piccolo e pieno di casi difficili: per i test sui singoli dati si allargano le soglie di blocco. */
const SENZA_BLOCCHI: Regole = {
  ...REGOLE,
  minimoDistributori: 0,
  minimoPrezzi: 0,
  massimoRigheIllegibili: 1,
  massimoPrezziAssurdi: 1,
  massimoCoordinateFuori: 1,
};

function controlla(anagraficaCsv: string, prezziCsv: string, regole: Regole) {
  const a = leggiAnagrafica(anagraficaCsv);
  const p = leggiPrezzi(prezziCsv);
  return controllaQualita(a, p, unisci(a, p), regole);
}

describe('controlli sui singoli dati (campione reale)', () => {
  const { distributori, resoconto, problemi } = controlla(
    campione('anagrafica_impianti_attivi.csv'),
    campione('prezzo_alle_8.csv'),
    SENZA_BLOCCHI,
  );
  const trova = (id: number) => distributori.find((d) => d.id === id);

  it('non blocca con le soglie allargate', () => {
    expect(problemi).toEqual([]);
  });

  it('esclude i distributori senza coordinate', () => {
    expect(resoconto.coordinateFuori).toBe(2);
    expect(trova(60502)).toBeUndefined();
    expect(trova(60116)).toBeUndefined();
  });

  it('scarta i prezzi assurdi: 0,10 € e 8,888 €', () => {
    expect(resoconto.prezziAssurdi).toBe(4);
    const tutti = distributori.flatMap((d) => d.prezzi.map((p) => p.euro));
    expect(tutti).not.toContain(0.1);
    expect(tutti).not.toContain(8.888);
  });

  it('usa il prezzo tipico del carburante normale se i premium sono troppo pochi', () => {
    // nel campione l'unica benzina premium è il segnaposto da 0,10 €
    expect(resoconto.prezziTipici['benzina premium']).toBe(0.1);
    expect(trova(55136)?.prezzi.some((p) => p.euro === 0.1)).not.toBe(true);
  });

  it('scarta il prezzo del 2013 ma tiene gli altri prezzi dello stesso distributore', () => {
    expect(resoconto.prezziScartatiPerEta).toBe(1);
    expect(trova(6471)?.prezzi.map((p) => p.carburante)).toEqual(['Benzina', 'Gasolio']);
  });

  it('segna come vecchi i prezzi comunicati da più di 7 giorni', () => {
    expect(resoconto.prezziVecchi).toBe(5);
    const vecchi = distributori.flatMap((d) => d.prezzi).filter((p) => p.vecchio);
    for (const p of vecchi) {
      expect(giorniTrascorsi(p.comunicato, '2026-11-17')).toBeGreaterThan(7);
    }
  });

  it('i conti tornano', () => {
    expect(resoconto.distributori).toBe(distributori.length);
    expect(resoconto.prezzi).toBe(distributori.reduce((s, d) => s + d.prezzi.length, 0));
    expect(resoconto.prezzi).toBe(113);
  });
});

describe('controlli che fermano la pubblicazione', () => {
  const ANAG =
    'Estrazione del 2026-11-17\nidImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine\n';
  const PREZ = 'Estrazione del 2026-11-17\nidImpianto|descCarburante|prezzo|isSelf|dtComu\n';
  /** n distributori a Roma, ognuno con un prezzo della benzina di 1,9 € comunicato ieri */
  const genera = (n: number, opzioni: { latitudine?: string; euro?: (i: number) => string } = {}) => {
    const righeA: string[] = [];
    const righeP: string[] = [];
    for (let i = 1; i <= n; i++) {
      righeA.push(`${i}|G|Q8|Stradale|N${i}|Via ${i}|ROMA|RM|${opzioni.latitudine ?? '41.9'}|12.5`);
      righeP.push(`${i}|Benzina|${opzioni.euro?.(i) ?? '1.900'}|1|16/11/2026 08:00:00`);
    }
    return [ANAG + righeA.join('\n'), PREZ + righeP.join('\n')] as const;
  };
  const regole: Regole = { ...REGOLE, minimoDistributori: 50, minimoPrezzi: 50 };

  it('va tutto bene con dati sani', () => {
    expect(controlla(...genera(100), regole).problemi).toEqual([]);
  });

  it('si ferma se ci sono troppo pochi distributori e prezzi', () => {
    expect(controlla(...genera(40), regole).problemi).toEqual([
      'Troppo pochi distributori: 40 (minimo 50)',
      'Troppo pochi prezzi: 40 (minimo 50)',
    ]);
  });

  it('si ferma se troppe coordinate sono fuori dall’Italia', () => {
    const problemi = controlla(...genera(100, { latitudine: '52.5' }), regole).problemi;
    expect(problemi[0]).toBe('Troppi distributori senza coordinate valide: 100 (100,0%)');
  });

  it('si ferma se troppi prezzi sono assurdi (per esempio decimali spostati)', () => {
    const [a, p] = genera(100, { euro: (i) => (i <= 5 ? '19.000' : '1.900') });
    expect(controlla(a, p, regole).problemi).toEqual(['Troppi prezzi fuori soglia: 5 (5,0%)']);
  });

  it('si ferma se troppe righe sono illeggibili', () => {
    const [a, p] = genera(100);
    const rovinate = '\n1|Benzina|abc|1|16/11/2026 08:00:00'.repeat(5);
    // 5 righe illeggibili su 205 = 2,4%, oltre il limite dell'1%
    expect(controlla(a, p + rovinate, regole).problemi).toEqual(['Troppe righe illeggibili: 5 (2,4%)']);
  });
});

describe('strumenti', () => {
  it('mediana', () => {
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 2, 3])).toBe(2.5);
    expect(mediana([])).toBeNaN();
  });

  it('giorniTrascorsi conta dalle 8 del giorno di estrazione', () => {
    expect(giorniTrascorsi('2026-11-10T08:00:00', '2026-11-17')).toBe(7);
    expect(giorniTrascorsi('2026-11-17T07:00:00', '2026-11-17')).toBeCloseTo(1 / 24);
  });
});
