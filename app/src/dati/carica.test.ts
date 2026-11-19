import { describe, expect, it } from 'vitest';
import { VERSIONE_FORMATO, type FilePrezzi } from '../../../condiviso/formato.ts';
import { caricaPrezzi, INDIRIZZO_PREZZI } from './carica.ts';

const file: FilePrezzi = {
  versione: VERSIONE_FORMATO,
  dataEstrazione: '2026-11-19',
  generato: '2026-11-19T08:31:00.000Z',
  fonte: 'MIMIT',
  carburanti: [['Gasolio', 'gasolio', 0]],
  bandiere: ['Q8'],
  comuni: [['Gallarate', 'VA', 45.66, 8.79]],
  distributori: [[1, 'Q8 Via Milano', 0, 'Via Milano 1', 0, 45.66, 8.79, 0, [[0, 1689, 1, 0]]]],
};

/** Un finto "scaricatore" che risponde come vogliamo noi, senza rete. */
function finto(risposta: Response | Error): typeof fetch {
  return (async (indirizzo: string | URL | Request) => {
    expect(indirizzo).toBe(INDIRIZZO_PREZZI);
    if (risposta instanceof Error) throw risposta;
    return risposta;
  }) as typeof fetch;
}

describe('caricaPrezzi', () => {
  it('legge il file e lo rende comodo per l\'app', async () => {
    const esito = await caricaPrezzi(finto(new Response(JSON.stringify(file))));
    expect(esito.tipo).toBe('ok');
    if (esito.tipo !== 'ok') return;
    expect(esito.dati.dataEstrazione).toBe('2026-11-19');
    expect(esito.dati.distributori[0]?.prezzi[0]?.euro).toBe(1.689);
  });

  it('senza rete dice "rete"', async () => {
    expect(await caricaPrezzi(finto(new TypeError('Failed to fetch')))).toEqual({ tipo: 'errore', motivo: 'rete' });
  });

  it('se il sito risponde con un errore dice "rete"', async () => {
    expect(await caricaPrezzi(finto(new Response('', { status: 404 })))).toEqual({ tipo: 'errore', motivo: 'rete' });
  });

  it('se il file è rovinato dice "formato"', async () => {
    expect(await caricaPrezzi(finto(new Response('{non è json')))).toEqual({ tipo: 'errore', motivo: 'formato' });
  });

  it('se il file ha un formato più nuovo dice "formato"', async () => {
    const futuro = { ...file, versione: VERSIONE_FORMATO + 1 };
    expect(await caricaPrezzi(finto(new Response(JSON.stringify(futuro))))).toEqual({ tipo: 'errore', motivo: 'formato' });
  });
});
