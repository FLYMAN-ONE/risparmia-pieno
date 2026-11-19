// Disegna la lista dei prezzi (passo 2, layout A): il più conveniente in grande, poi gli altri in righe.
import { unitaDi, type Categoria } from '../../../condiviso/carburanti.ts';
import { giornoBreve } from '../dati/data.ts';
import { icona } from '../icone/icone.ts';
import type { Lista, Ordine, Voce } from './lista.ts';
import { formattaCifre, formattaDifferenza, formattaKm } from './prezzo.ts';
import { esc, indirizzoBreve } from './testo.ts';

/** Il nome da mostrare: il marchio scritto (niente loghi). Le pompe bianche non hanno marchio. */
export function nomeDi(voce: Voce): string {
  const { bandiera } = voce.distributore;
  return !bandiera || bandiera === 'Pompe Bianche' ? 'Pompa bianca' : bandiera;
}

function quandoOVecchio(voce: Voce): string {
  if (!voce.vecchio) return `<span class="km">${formattaKm(voce.km)}</span>`;
  return `<span class="vecchio">${icona('prezzoVecchio')}<span class="solo-lettori">Prezzo vecchio, comunicato il </span>${giornoBreve(voce.comunicato)}</span>`;
}

function eroe(voce: Voce, media: number, unita: string): string {
  const differenza = voce.euro - media;
  const comune = voce.distributore.comune.nome;
  return `<article class="eroe fascia-${voce.fascia}${voce.vecchio ? ' e-vecchio' : ''}">
    <p class="etichetta">Il più conveniente</p>
    <p class="prezzo">${formattaCifre(voce.euro)}<span class="unita"> €/${unita}</span></p>
    <p class="chi">${esc(nomeDi(voce))} · ${formattaKm(voce.km)}</p>
    <p class="dove">${esc(indirizzoBreve(voce.distributore.indirizzo, comune))}</p>
    ${voce.vecchio ? `<p class="dove vecchio">${icona('prezzoVecchio')}Prezzo comunicato il ${giornoBreve(voce.comunicato)}</p>` : ''}
    <p class="delta"><b>${formattaDifferenza(differenza)}</b> rispetto alla media</p>
  </article>`;
}

function riga(voce: Voce): string {
  return `<li class="riga fascia-${voce.fascia}${voce.vecchio ? ' e-vecchio' : ''}">
    <span class="prezzo">${formattaCifre(voce.euro)}</span>
    <span class="chi"><span class="nome">${esc(nomeDi(voce))}</span>
      <span class="dove">${esc(indirizzoBreve(voce.distributore.indirizzo, voce.distributore.comune.nome))}</span></span>
    ${quandoOVecchio(voce)}
  </li>`;
}

export interface OpzioniVista {
  carburante: Categoria;
  raggioKm: number;
  ordine: Ordine;
  /** le voci già nell'ordine scelto */
  voci: readonly Voce[];
}

export function disegnaLista(lista: Lista, opzioni: OpzioniVista): string {
  const { migliore, media } = lista;
  if (!migliore) {
    // Testo del passo 11. "Allarga a 10 km" arriva con i casi limite.
    return `<div class="messaggio" role="status">${icona('cerca')}<div>
      <p>Nessun distributore entro ${String(opzioni.raggioKm)} km.</p></div></div>`;
  }
  const altri = opzioni.voci.filter((v) => v !== migliore);
  const quanti = lista.voci.length;
  return `<section class="lista" aria-label="Distributori">
    ${eroe(migliore, media, unitaDi(opzioni.carburante))}
    <div class="lista-testa">
      <p>${String(quanti)} ${quanti === 1 ? 'distributore' : 'distributori'} entro ${String(opzioni.raggioKm)} km</p>
      <button type="button" class="ordina" data-ordina aria-label="Ordina per ${opzioni.ordine === 'prezzo' ? 'distanza' : 'prezzo'}">
        ${icona('ordina')}${opzioni.ordine === 'prezzo' ? 'Per prezzo' : 'Per distanza'}
      </button>
    </div>
    <ol class="righe">${altri.map(riga).join('')}</ol>
  </section>`;
}
