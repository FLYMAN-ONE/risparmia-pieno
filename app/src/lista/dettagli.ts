// "Tutti i prezzi" di un distributore: il contenuto della scheda, uguale nella lista e sulla mappa.
// Mostra marchio e indirizzo altrove; qui i prezzi di ogni carburante e la data del gestore.
import { CATEGORIE, NOME_CATEGORIA, unitaDi, type Categoria } from '../../../condiviso/carburanti.ts';
import type { DistributoreApp } from '../../../condiviso/formato.ts';
import { giornoBreve } from '../dati/data.ts';
import { icona } from '../icone/icone.ts';
import { formattaPrezzo } from './prezzo.ts';

export interface RigaPrezzo {
  nome: string;
  euro: number;
  unita: 'l' | 'kg';
  vecchio: boolean;
  comunicato: string;
  /** il carburante scelto nei filtri */
  scelto: boolean;
}

/**
 * Un prezzo per ogni carburante, self e servito, normale e premium (il più basso se il gestore ne ha due).
 * Prima il carburante scelto, poi gli altri nell'ordine solito. "Altro" (GNL per camion) non si mostra.
 */
export function prezziDelDistributore(distributore: DistributoreApp, carburante: Categoria): RigaPrezzo[] {
  const migliori = new Map<string, DistributoreApp['prezzi'][number]>();
  for (const p of distributore.prezzi) {
    if (p.categoria === 'altro') continue;
    const chiave = `${p.categoria}|${String(p.premium)}|${String(p.self)}`;
    const gia = migliori.get(chiave);
    if (!gia || p.euro < gia.euro) migliori.set(chiave, p);
  }
  const posto = (c: Categoria) => (c === carburante ? -1 : CATEGORIE.indexOf(c));
  return [...migliori.values()]
    .sort((a, b) => posto(a.categoria) - posto(b.categoria) || Number(a.premium) - Number(b.premium) || Number(b.self) - Number(a.self))
    .map((p) => ({
      nome: `${NOME_CATEGORIA[p.categoria]}${p.premium ? ' premium' : ''} ${p.self ? 'self' : 'servito'}`,
      euro: p.euro,
      unita: unitaDi(p.categoria),
      vecchio: p.vecchio,
      comunicato: p.comunicato,
      scelto: p.categoria === carburante,
    }));
}

/** L'ultimo giorno in cui il gestore ha comunicato un prezzo, "2026-11-18" */
export function ultimoAggiornamento(distributore: DistributoreApp): string | undefined {
  return distributore.prezzi.reduce<string | undefined>((ultimo, p) => (!ultimo || p.comunicato > ultimo ? p.comunicato : ultimo), undefined);
}

/** Il blocco dei prezzi. id: per collegarlo al bottone che lo apre (aria-controls). */
export function disegnaPrezzi(distributore: DistributoreApp, carburante: Categoria, id: string): string {
  const righe = prezziDelDistributore(distributore, carburante);
  const ultimo = ultimoAggiornamento(distributore);
  return `<div class="tutti-prezzi" id="${id}">
    <table>
      <caption class="solo-lettori">Tutti i prezzi</caption>
      <tbody>${righe
        .map(
          (r) => `<tr${r.scelto ? ' class="scelto"' : ''}${r.vecchio ? ' data-vecchio' : ''}>
          <th scope="row">${r.nome}</th>
          <td>${r.vecchio ? `<span class="vecchio">${icona('prezzoVecchio')}<span class="solo-lettori">Prezzo vecchio, comunicato il </span>${giornoBreve(r.comunicato)}</span>` : ''}${formattaPrezzo(r.euro, r.unita)}</td>
        </tr>`,
        )
        .join('')}</tbody>
    </table>
    ${ultimo ? `<p class="aggiornato">Aggiornato dal gestore il ${giornoBreve(ultimo)}</p>` : ''}
  </div>`;
}
