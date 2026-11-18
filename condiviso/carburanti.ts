// Categorie dei carburanti, comuni alla cucina e all'app.
// Decisioni del 18/11/2026: premium separati con un'etichetta, gasolio invernale = gasolio,
// GNL (metano liquido per camion) in "altro".

export const CATEGORIE = ['benzina', 'gasolio', 'gpl', 'metano', 'hvo', 'altro'] as const;

export type Categoria = (typeof CATEGORIE)[number];

/** Nome da mostrare nell'app per ogni categoria. */
export const NOME_CATEGORIA: Record<Categoria, string> = {
  benzina: 'Benzina',
  gasolio: 'Gasolio',
  gpl: 'GPL',
  metano: 'Metano',
  hvo: 'HVO',
  altro: 'Altro',
};

/** Il metano si vende al chilo, tutto il resto al litro. */
export function unitaDi(categoria: Categoria): 'l' | 'kg' {
  return categoria === 'metano' ? 'kg' : 'l';
}
