import { describe, expect, it } from 'vitest';
import type { DistributoreApp } from '../../../condiviso/formato.ts';
import type { Lista, Voce } from './lista.ts';
import { disegnaLista, disegnaRiquadro, nomeDi } from './vista.ts';

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
    expect(html).toMatch(/class="bottone secondario naviga" data-naviga href="https:\/\/maps\.apple\.com\/\?daddr=/);
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('ogni riga ha il suo Naviga, che dice a VoiceOver dove porta', () => {
    const html = disegnaLista(lista, { ...opzioni, voci: lista.voci });
    expect(html.match(/data-naviga/g)).toHaveLength(2);
    expect(html).toMatch(/class="naviga-icona"[^>]*rel="noopener noreferrer"\s+aria-label="Naviga verso [^"]+, [\d,]+ km"/);
  });

  it('la nota su Naviga compare solo finché non è stato usato', () => {
    expect(disegnaLista(lista, { ...opzioni, voci: lista.voci })).toContain('Naviga apre Mappe o Google Maps con la destinazione.');
    const dopo = disegnaLista(lista, { ...opzioni, navigazione: { app: 'google', conNota: false }, voci: lista.voci });
    expect(dopo).not.toContain('nota-naviga');
    expect(dopo).toContain('href="https://www.google.com/maps/dir/');
  });

  it('il più conveniente non si ripete nelle righe', () => {
    const html = disegnaLista(lista, { ...opzioni, voci: lista.voci });
    expect(html.match(/class="riga[ "]/g)).toHaveLength(1);
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

describe('casi limite', () => {
  const vuota: Lista = { voci: [], migliore: undefined, media: 0 };

  it('nessun risultato: propone il raggio successivo', () => {
    const html = disegnaLista(vuota, { ...opzioni, voci: [] });
    expect(html).toContain('Nessun distributore entro 5 km.');
    expect(html).toContain('data-allarga="10">Allarga a 10 km</button>');
    expect(disegnaLista(vuota, { ...opzioni, raggioKm: 10, voci: [] })).toContain('Allarga a 15 km');
  });

  it('a 15 km non c\'è un raggio più largo: solo il messaggio', () => {
    const html = disegnaLista(vuota, { ...opzioni, raggioKm: 15, voci: [] });
    expect(html).toContain('Nessun distributore entro 15 km.');
    expect(html).not.toContain('data-allarga');
  });

  it('un solo distributore: niente confronto con la media', () => {
    const solo = voce(1, 1.689);
    const html = disegnaLista({ voci: [solo], migliore: solo, media: 1.689 }, { ...opzioni, voci: [solo] });
    expect(html).not.toContain('rispetto alla media');
    expect(html).toContain('1 distributore entro 5 km');
  });
});

describe('scheda nella lista', () => {
  const primo = voce(1, 1.689, { prezzi: [{ carburante: 'Gasolio', categoria: 'gasolio', premium: false, euro: 1.689, self: true, vecchio: false, comunicato: '2026-11-18' }] });
  const secondo = voce(2, 1.699, { prezzi: [{ carburante: 'Benzina', categoria: 'benzina', premium: false, euro: 1.759, self: true, vecchio: false, comunicato: '2026-11-17' }] });
  const lista: Lista = { voci: [primo, secondo], migliore: primo, media: 1.7 };

  it('chiusa: ogni riga e il più conveniente hanno il bottone che apre, senza dettagli', () => {
    const html = disegnaLista(lista, { ...opzioni, voci: lista.voci });
    expect(html.match(/data-apri="/g)).toHaveLength(2);
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(2);
    expect(html).not.toContain('tutti-prezzi');
  });

  it('aperta una riga: i suoi prezzi, la data del gestore e Naviga; solo quella', () => {
    const html = disegnaLista(lista, { ...opzioni, voci: lista.voci, aperto: 2 });
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(html).toContain('aria-controls="prezzi-2"');
    expect(html).toContain('id="prezzi-2"');
    expect(html).toContain('1,759 €/l');
    expect(html).toContain('Aggiornato dal gestore il 17/11');
    expect(html).toMatch(/riga-dettagli[\s\S]*class="bottone secondario naviga"/);
  });

  it('aperto il più conveniente: i prezzi dentro il suo blocco', () => {
    const html = disegnaLista(lista, { ...opzioni, voci: lista.voci, aperto: 1 });
    expect(html).toMatch(/class="eroe[\s\S]*id="prezzi-1"[\s\S]*<\/article>/);
  });
});

describe('disegnaRiquadro (mappa)', () => {
  const v = voce(7, 1.689, { prezzi: [{ carburante: 'Gasolio', categoria: 'gasolio', premium: false, euro: 1.689, self: true, vecchio: false, comunicato: '2026-11-18' }] });

  it('nome, distanza, prezzo, confronto, chiudi e Naviga', () => {
    const html = disegnaRiquadro(v, 1.729, { carburante: 'gasolio', app: 'apple', tutti: false });
    expect(html).toContain('Q8 · 1,2 km');
    expect(html).toContain('1,689<span class="unita"> €/l</span>');
    expect(html).toContain('−0,04 €');
    expect(html).toContain('data-chiudi-riquadro aria-label="Chiudi"');
    expect(html).toContain('data-naviga');
    expect(html).toContain('data-apri="7" aria-expanded="false"');
    expect(html).not.toContain('tutti-prezzi');
  });

  it('con "Tutti i prezzi" aperto mostra la tabella', () => {
    const html = disegnaRiquadro(v, 1.729, { carburante: 'gasolio', app: 'apple', tutti: true });
    expect(html).toContain('id="prezzi-7"');
    expect(html).toContain('Aggiornato dal gestore il 18/11');
  });
});
