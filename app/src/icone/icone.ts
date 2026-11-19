// Icone dell'interfaccia (passo 7): set Lucide, a linea, incluso nell'app.
// Licenza ISC, vedi lucide/LICENSE.txt. Un nome italiano per ogni significato,
// così in tutta l'app la stessa azione ha sempre la stessa icona.

const file = import.meta.glob<string>('./lucide/*.svg', { query: '?raw', import: 'default', eager: true });

export const ICONE = {
  intornoAMe: 'locate-fixed',
  naviga: 'navigation',
  cerca: 'search',
  mappa: 'map',
  lista: 'list',
  ordina: 'arrow-up-down',
  scegli: 'chevron-down',
  chiudi: 'x',
  prezzoVecchio: 'clock',
  info: 'info',
  offline: 'wifi-off',
  impostazioni: 'settings',
} as const;

export type NomeIcona = keyof typeof ICONE;

/**
 * Il disegno SVG dell'icona, pronto da inserire nella pagina.
 * È decorativo (aria-hidden): il significato lo dice sempre il testo accanto
 * o l'etichetta del bottone.
 */
export function icona(nome: NomeIcona): string {
  const disegno = file[`./lucide/${ICONE[nome]}.svg`];
  if (!disegno) throw new Error(`Icona mancante: ${nome}`);
  return disegno.replace('<svg', '<svg aria-hidden="true" focusable="false"');
}
