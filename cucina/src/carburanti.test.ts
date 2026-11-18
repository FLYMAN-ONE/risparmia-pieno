import { describe, expect, it } from 'vitest';
import { classificaCarburante } from './carburanti.ts';

/** I 59 nomi presenti nel file MIMIT del 17/11/2026. */
const NOMI_REALI = [
  'Benzina', 'Gasolio', 'Blue Diesel', 'GPL', 'HVOlution', 'Supreme Diesel', 'Metano', 'Blue Super',
  'HVO', 'Hi-Q Diesel', 'Gasolio speciale', 'HiQ Perform+', 'Gasolio Premium', 'Benzina speciale',
  'Benzina WR 100', 'GNL', 'Diesel Shell V Power', 'L-GNC', 'DieselMax', 'HVO100', 'Gasolio artico',
  'S-Diesel', 'Benzina Shell V Power', 'Excellium Diesel', 'Gasolio Oro Diesel', 'REHVO', 'F101',
  'Diesel HVO', 'Gasolio Energy D', 'E-DIESEL', 'Gasolio Bio HVO', 'Gasolio Artico', 'GP DIESEL',
  'Benzina Energy 98 ottani', 'BCHVO', 'Gasolio Ecoplus', 'Benzina Plus 98', 'Gasolio Alpino',
  'Gasolio Gelo', 'Gasolio HVO', 'Blu Diesel Alpino', 'V-Power', 'Excellium diesel', 'HVO eco diesel',
  'HVO Future', 'HiQ Perform B100 Ottani', 'Gasolio Prestazionale', 'Gasolio Plus', 'Diesel HVO Energy',
  'Benzina Speciale 98 Ottani', 'Verde speciale', 'HVO Energy Diesel', 'HVOvolution', 'F-101',
  'Gasolio Artico Igloo', 'Benzina 100 ottani', 'V-Power Diesel', 'Benzina 102 Ottani', 'GASOLIO HVO',
];

describe('classificaCarburante', () => {
  it('conosce tutti i 59 nomi reali', () => {
    expect(NOMI_REALI).toHaveLength(59);
    const sconosciuti = NOMI_REALI.filter((n) => classificaCarburante(n).sconosciuto);
    expect(sconosciuti).toEqual([]);
  });

  it.each([
    ['Benzina', 'benzina', false],
    ['Blue Super', 'benzina', true],
    ['Gasolio', 'gasolio', false],
    ['Gasolio artico', 'gasolio', false],
    ['Blue Diesel', 'gasolio', true],
    ['GPL', 'gpl', false],
    ['Metano', 'metano', false],
    ['L-GNC', 'metano', false],
    ['GNL', 'altro', false],
    ['HVOlution', 'hvo', false],
  ] as const)('%s → %s (premium: %s)', (nome, categoria, premium) => {
    expect(classificaCarburante(nome)).toEqual({ categoria, premium, sconosciuto: false });
  });

  it('ignora maiuscole e spazi in più', () => {
    expect(classificaCarburante('  excellium   DIESEL ').categoria).toBe('gasolio');
  });

  it('mette i nomi nuovi in "altro" e li segnala', () => {
    expect(classificaCarburante('Idrogeno')).toEqual({
      categoria: 'altro',
      premium: false,
      sconosciuto: true,
    });
  });
});
