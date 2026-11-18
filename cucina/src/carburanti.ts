// Riconduce i nomi dei carburanti usati dai gestori (59 a novembre 2026) alle categorie dell'app.
import type { Categoria } from '../../condiviso/carburanti.ts';

export interface Classificazione {
  categoria: Categoria;
  /** vero per le versioni "speciali", più care: non entrano nel confronto dei prezzi */
  premium: boolean;
  /** vero se il nome non è nella tabella: va controllato e aggiunto */
  sconosciuto: boolean;
}

/** Tabella dei nomi conosciuti, scritti in minuscolo. */
const TABELLA: Record<string, [Categoria, boolean]> = {};
function aggiungi(categoria: Categoria, premium: boolean, nomi: string[]): void {
  for (const nome of nomi) TABELLA[nome] = [categoria, premium];
}

aggiungi('benzina', false, ['benzina']);
aggiungi('benzina', true, [
  'blue super', 'benzina speciale', 'benzina wr 100', 'benzina shell v power', 'v-power',
  'hiq perform+', 'hiq perform b100 ottani', 'benzina plus 98', 'benzina energy 98 ottani',
  'benzina speciale 98 ottani', 'benzina 100 ottani', 'benzina 102 ottani', 'verde speciale',
]);
// Il gasolio invernale (artico, alpino, gelo) è il gasolio normale delle zone fredde
aggiungi('gasolio', false, [
  'gasolio', 'gasolio artico', 'gasolio alpino', 'gasolio gelo', 'gasolio artico igloo',
]);
aggiungi('gasolio', true, [
  'blue diesel', 'blu diesel alpino', 'supreme diesel', 'hi-q diesel', 'gasolio speciale',
  'gasolio premium', 'gasolio prestazionale', 'gasolio plus', 'gasolio oro diesel',
  'gasolio energy d', 'gasolio ecoplus', 'diesel shell v power', 'v-power diesel', 'dieselmax',
  's-diesel', 'excellium diesel', 'e-diesel', 'gp diesel',
]);
aggiungi('gpl', false, ['gpl']);
// L-GNC: metano liquefatto e poi compresso, va bene per le auto a metano
aggiungi('metano', false, ['metano', 'l-gnc']);
aggiungi('hvo', false, [
  'hvo', 'hvo100', 'hvolution', 'hvovolution', 'rehvo', 'bchvo', 'diesel hvo', 'gasolio hvo',
  'gasolio bio hvo', 'hvo eco diesel', 'hvo future', 'diesel hvo energy', 'hvo energy diesel',
]);
// GNL: metano liquido, usato quasi solo dai camion. F101: natura non verificata.
aggiungi('altro', false, ['gnl', 'f101', 'f-101']);

export function classificaCarburante(nome: string): Classificazione {
  const chiave = nome.replace(/\s+/g, ' ').trim().toLowerCase();
  const trovato = TABELLA[chiave];
  if (!trovato) return { categoria: 'altro', premium: false, sconosciuto: true };
  return { categoria: trovato[0], premium: trovato[1], sconosciuto: false };
}
