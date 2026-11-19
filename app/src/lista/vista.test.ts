import { describe, expect, it } from 'vitest';
import type { DistributoreApp } from '../../../condiviso/formato.ts';
import type { Lista, Voce } from './lista.ts';
import { disegnaLista, nomeDi } from './vista.ts';

function voce(id: number, euro: number, altro: Partial<DistributoreApp> = {}, vecchio = false): Voce {
  return {
    distributore: {
      id,
      nome: 'Gestore srl',
      bandiera: 'Q8',
      indirizzo: 'VIA ROMA 1 21013',
      comune: { nome: 'GALLARATE', provincia: 'VA', lat: 45.66, lon: 8.79 },
      lat: 45.66,
      lon: 8.79,
      autostradale: false,
      prezzi: [],
      ...altro,
    },
    km: 1.23,
    euro,
    self: true,
    vecchio,
    comunicato: '2026-11-09',
    fascia: 'media',
  };
}

const opzioni = { carburante: 'gasolio', raggioKm: 5, ordine: 'prezzo', navigazione: { app: 'apple', conNota: true } } as const;

describe('nomeDi', () => {
  it('mostra il marchio scritto', () => {
    expect(nomeDi(voce(1, 1.7))).toBe('Q8');
  });

  it('le pompe bianche si chiamano "Pompa bianca"', () => {
    expect(nomeDi(voce(1, 1.7, { bandiera: 'Pompe Bianche' }))).toBe('Pompa bianca');
    expect(nomeDi(voce(1, 1.7, { bandiera: '' }))).toBe('Pompa bianca');
  });
});

describe('disegnaLista', () => {
  const primo = voce(1, 1.689);
  const secondo = voce(2, 1.699);
  const lista: Lista = { voci: [primo, secondo], migliore: primo, media: 1.729 };

  it('mette il più conveniente in grande, con la differenza dalla media', () => {
    const html = disegnaLista(lista, { ...opzioni, voci: lista.voci });
    expect(html).toContain('Il più conveniente');
    expect(html).toContain('1,689<span class="unita"> €/l</span>');
    expect(html).toContain('−0,04 €');
    expect(html).toContain('Via Roma 1, Gallarate');
  });

  it('il più conveniente ha il tasto Naviga, che si apre a parte e senza referrer', () => {
    const html = disegnaLista(lista, { ...opzioni, voci: lista.voci });
    expect(html.match(/data-naviga/g)).toHaveLength(1);
    expect(html).toContain('href="https://maps.apple.com/?daddr=');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('la nota su Naviga compare solo finché non è stato usato', () => {
    expect(disegnaLista(lista, { ...opzioni, voci: lista.voci })).toContain('Naviga apre Mappe o Google Maps con la destinazione.');
    const dopo = disegnaLista(lista, { ...opzioni, navigazione: { app: 'google', conNota: false }, voci: lista.voci });
    expect(dopo).not.toContain('nota-naviga');
    expect(dopo).toContain('href="https://www.google.com/maps/dir/');
  });

  it('il più conveniente non si ripete nelle righe', () => {
    const html = disegnaLista(lista, { ...opzioni, voci: lista.voci });
    expect(html.match(/class="riga/g)).toHaveLength(1);
  });

  it('conta i distributori e il raggio', () => {
    expect(disegnaLista(lista, { ...opzioni, voci: lista.voci })).toContain('<p>2 distributori entro 5 km');
  });

  it('per il metano usa €/kg', () => {
    expect(disegnaLista(lista, { ...opzioni, carburante: 'metano', voci: lista.voci })).toContain('€/kg');
  });

  it('i prezzi vecchi mostrano la data invece della distanza', () => {
    const vecchio = voce(3, 1.68, {}, true);
    const html = disegnaLista({ voci: [primo, vecchio], migliore: primo, media: 1.7 }, { ...opzioni, voci: [primo, vecchio] });
    expect(html).toContain('e-vecchio');
    expect(html).toContain('Prezzo vecchio, comunicato il </span>09/11');
  });

  it('i testi dei dati non possono inserire codice nella pagina', () => {
    const cattivo = voce(1, 1.6, { bandiera: '<img src=x onerror=alert(1)>' });
    const html = disegnaLista({ voci: [cattivo], migliore: cattivo, media: 1.6 }, { ...opzioni, voci: [cattivo] });
    expect(html).not.toContain('<img');
  });

  it('senza distributori mostra il messaggio deciso', () => {
    const html = disegnaLista({ voci: [], migliore: undefined, media: 0 }, { ...opzioni, voci: [] });
    expect(html).toContain('Nessun distributore entro 5 km.');
  });
});
