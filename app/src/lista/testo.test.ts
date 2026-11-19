import { describe, expect, it } from 'vitest';
import { esc, inCaratteriNormali, indirizzoBreve, senzaCap } from './testo.ts';

describe('inCaratteriNormali', () => {
  it('riscrive i testi tutti maiuscoli', () => {
    expect(inCaratteriNormali('VIA DELLA REPUBBLICA 12')).toBe('Via della Repubblica 12');
    expect(inCaratteriNormali('ABBADIA SAN SALVATORE')).toBe('Abbadia San Salvatore');
  });

  it("gestisce gli apostrofi", () => {
    expect(inCaratteriNormali("SANT'ANGELO LODIGIANO")).toBe("Sant'Angelo Lodigiano");
  });

  it('lascia maiuscole le sigle stradali', () => {
    expect(inCaratteriNormali('SS 131 KM 229+825 SNC')).toBe('SS 131 km 229+825 SNC');
  });

  it('lascia stare i testi già scritti bene', () => {
    expect(inCaratteriNormali('Viale Giacomo Matteotti 165')).toBe('Viale Giacomo Matteotti 165');
  });

  it('ai testi tutti minuscoli mette la maiuscola iniziale', () => {
    expect(inCaratteriNormali('via giuseppe verdi 49')).toBe('Via giuseppe verdi 49');
  });
});

describe('senzaCap', () => {
  it('toglie il CAP finale', () => {
    expect(senzaCap('VIA MARCONI 6 21030')).toBe('VIA MARCONI 6');
    expect(senzaCap('Statale 4 Via Salaria, Km. 52,243, dir. Roma - 02038')).toBe('Statale 4 Via Salaria, Km. 52,243, dir. Roma');
  });

  it('non tocca i numeri civici', () => {
    expect(senzaCap('VIA PORRETTANA 500')).toBe('VIA PORRETTANA 500');
  });
});

describe('indirizzoBreve', () => {
  it('unisce via e comune', () => {
    expect(indirizzoBreve('VIA GRANDI 31 20099', 'SESTO SAN GIOVANNI')).toBe('Via Grandi 31, Sesto San Giovanni');
  });

  it('senza via mostra il comune', () => {
    expect(indirizzoBreve('', 'GALLARATE')).toBe('Gallarate');
  });
});

describe('esc', () => {
  it('rende innocuo il codice nei testi', () => {
    expect(esc('<img src=x onerror=alert(1)>')).not.toContain('<');
    expect(esc("Bar & Benzina 'Da Gino'")).toBe('Bar &#38; Benzina &#39;Da Gino&#39;');
  });
});
