import { describe, expect, it } from 'vitest';
import type { DistributoreApp, PrezzoApp } from '../../../condiviso/formato.ts';
import { disegnaPrezzi, prezziDelDistributore, ultimoAggiornamento } from './dettagli.ts';

const prezzo = (altro: Partial<PrezzoApp>): PrezzoApp => ({
  carburante: 'Gasolio',
  categoria: 'gasolio',
  premium: false,
  euro: 1.8,
  self: true,
  vecchio: false,
  comunicato: '2026-11-18',
  ...altro,
});

const distributore = (prezzi: PrezzoApp[]): DistributoreApp => ({
  id: 1,
  nome: 'Gestore',
  bandiera: 'Q8',
  indirizzo: 'VIA ROMA 1',
  comune: { nome: 'GALLARATE', provincia: 'VA', lat: 45.66, lon: 8.79 },
  lat: 45.66,
  lon: 8.79,
  autostradale: false,
  prezzi,
});

describe('prezziDelDistributore', () => {
  const d = distributore([
    prezzo({ categoria: 'benzina', euro: 1.739 }),
    prezzo({ categoria: 'gasolio', self: false, euro: 1.949 }),
    prezzo({ categoria: 'gasolio', euro: 1.799 }),
    prezzo({ categoria: 'gpl', self: false, euro: 0.878 }),
    prezzo({ categoria: 'metano', self: false, euro: 1.399 }),
    prezzo({ categoria: 'altro', euro: 1.2 }),
  ]);

  it('prima il carburante scelto (self poi servito), poi gli altri in ordine', () => {
    expect(prezziDelDistributore(d, 'gasolio').map((r) => r.nome)).toEqual([
      'Gasolio self',
      'Gasolio servito',
      'Benzina self',
      'GPL servito',
      'Metano servito',
    ]);
  });

  it('segna il carburante scelto e usa i chili per il metano', () => {
    const righe = prezziDelDistributore(d, 'gpl');
    expect(righe[0]).toMatchObject({ nome: 'GPL servito', scelto: true, unita: 'l' });
    expect(righe.find((r) => r.nome === 'Metano servito')?.unita).toBe('kg');
    expect(righe.filter((r) => r.scelto)).toHaveLength(1);
  });

  it('niente "Altro" (GNL per camion)', () => {
    expect(prezziDelDistributore(d, 'gasolio').some((r) => r.nome.startsWith('Altro'))).toBe(false);
  });

  it('due prezzi uguali per tipo (es. gasolio e gasolio invernale): tiene il più basso', () => {
    const doppio = distributore([prezzo({ euro: 1.85 }), prezzo({ euro: 1.79 })]);
    expect(prezziDelDistributore(doppio, 'gasolio')).toHaveLength(1);
    expect(prezziDelDistributore(doppio, 'gasolio')[0]?.euro).toBe(1.79);
  });

  it('il premium va dopo il normale', () => {
    const conPremium = distributore([prezzo({ premium: true, euro: 1.9 }), prezzo({ euro: 1.8 })]);
    expect(prezziDelDistributore(conPremium, 'gasolio').map((r) => r.nome)).toEqual(['Gasolio self', 'Gasolio premium self']);
  });
});

describe('ultimoAggiornamento e disegnaPrezzi', () => {
  const d = distributore([prezzo({ comunicato: '2026-11-09', vecchio: true }), prezzo({ categoria: 'benzina', comunicato: '2026-11-18' })]);

  it('la data più recente comunicata dal gestore', () => {
    expect(ultimoAggiornamento(d)).toBe('2026-11-18');
    expect(ultimoAggiornamento(distributore([]))).toBeUndefined();
  });

  it('tabella con i prezzi, il vecchio segnato, la data del gestore', () => {
    const html = disegnaPrezzi(d, 'gasolio', 'prezzi-1');
    expect(html).toContain('id="prezzi-1"');
    expect(html).toContain('1,800 €/l');
    expect(html).toContain('Prezzo vecchio, comunicato il </span>09/11');
    expect(html).toContain('Aggiornato dal gestore il 18/11');
  });
});
