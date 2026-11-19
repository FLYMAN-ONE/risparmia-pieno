// Disegna la lista dei prezzi (passo 2, layout A): il più conveniente in grande, poi gli altri in righe.
import { unitaDi, type Categoria } from '../../../condiviso/carburanti.ts';
import { giornoBreve } from '../dati/data.ts';
import { icona } from '../icone/icone.ts';
import type { Lista, Ordine, Voce } from './lista.ts';
import { linkNavigazione, type AppMappe } from '../navigazione/naviga.ts';
import { formattaCifre, formattaDifferenza, formattaKm } from './prezzo.ts';
import { esc, indirizzoBreve } from './testo.ts';
import { RAGGI_KM } from '../vicini/vicini.ts';
import { disegnaPrezzi } from './dettagli.ts';

/** Il nome da mostrare: il marchio scritto (niente loghi). Le pompe bianche non hanno marchio. */
export function nomeDi(voce: Voce): string {
  const { bandiera } = voce.distributore;
  return !bandiera || bandiera === 'Pompe Bianche' ? 'Pompa bianca' : bandiera;
}

function quandoOVecchio(voce: Voce): string {
  if (!voce.vecchio) return `<span class="km">${formattaKm(voce.km)}</span>`;
  return `<span class="vecchio">${icona('prezzoVecchio')}<span class="solo-lettori">Prezzo vecchio, comunicato il </span>${giornoBreve(voce.comunicato)}</span>`;
}

/** Il tasto Naviga: un link che apre l'app di navigazione solo quando lo si tocca (regola privacy 9).
    noreferrer: l'app di mappe non sa da quale pagina si arriva. */
export function naviga(voce: Voce, app: AppMappe, conNota: boolean): string {
  const { lat, lon } = voce.distributore;
  return `<a class="bottone secondario naviga" data-naviga href="${linkNavigazione(lat, lon, app)}" target="_blank" rel="noopener noreferrer"
      aria-label="Naviga verso ${esc(nomeDi(voce))}">${icona('naviga')}Naviga</a>
    ${conNota ? '<p class="nota-naviga">Naviga apre Mappe o Google Maps con la destinazione.</p>' : ''}`;
}

/** "−0,04 € rispetto alla media"; niente riga se non c'è differenza (per esempio un solo distributore). */
export function confronto(differenza: number): string {
  if (Math.round(differenza * 100) === 0) return '';
  return `<p class="delta"><b>${formattaDifferenza(differenza)}</b> rispetto alla media</p>`;
}

/** Il bottone che apre e chiude "tutti i prezzi" di un distributore */
export function bottoneDettagli(voce: Voce, aperto: boolean): string {
  const id = String(voce.distributore.id);
  return `<button type="button" class="apri-dettagli" data-apri="${id}" aria-expanded="${String(aperto)}"${aperto ? ` aria-controls="prezzi-${id}"` : ''}>
    Tutti i prezzi${icona('scegli')}</button>`;
}

function eroe(voce: Voce, media: number, unita: string, opzioni: OpzioniVista): string {
  const { navigazione } = opzioni;
  const aperto = opzioni.aperto === voce.distributore.id;
  const differenza = voce.euro - media;
  const comune = voce.distributore.comune.nome;
  return `<article class="eroe fascia-${voce.fascia}${voce.vecchio ? ' e-vecchio' : ''}">
    <p class="etichetta">Il più conveniente</p>
    <p class="prezzo">${formattaCifre(voce.euro)}<span class="unita"> €/${unita}</span></p>
    <div class="eroe-sotto">
      <div class="eroe-dove">
        <p class="chi">${esc(nomeDi(voce))} · ${formattaKm(voce.km)}</p>
        <p class="dove">${esc(indirizzoBreve(voce.distributore.indirizzo, comune))}</p>
      </div>
      ${naviga(voce, navigazione.app, navigazione.conNota)}
    </div>
    ${voce.vecchio ? `<p class="dove vecchio">${icona('prezzoVecchio')}Prezzo comunicato il ${giornoBreve(voce.comunicato)}</p>` : ''}
    ${confronto(differenza)}
    ${bottoneDettagli(voce, aperto)}
    ${aperto ? disegnaPrezzi(voce.distributore, opzioni.carburante, `prezzi-${String(voce.distributore.id)}`) : ''}
  </article>`;
}

/** Naviga nelle righe: solo l'icona, per non appesantire la tabella dei prezzi. */
function navigaIcona(voce: Voce, app: AppMappe): string {
  const { lat, lon } = voce.distributore;
  return `<a class="naviga-icona" data-naviga href="${linkNavigazione(lat, lon, app)}" target="_blank" rel="noopener noreferrer"
      aria-label="Naviga verso ${esc(nomeDi(voce))}, ${formattaKm(voce.km)}">${icona('naviga')}</a>`;
}

/** Una riga: toccandola si apre sotto di lei con tutti i prezzi e Naviga (decisione del 19/11/2026). */
function riga(voce: Voce, opzioni: OpzioniVista): string {
  const { app } = opzioni.navigazione;
  const id = String(voce.distributore.id);
  const aperto = opzioni.aperto === voce.distributore.id;
  return `<li class="riga fascia-${voce.fascia}${voce.vecchio ? ' e-vecchio' : ''}${aperto ? ' aperta' : ''}">
    <button type="button" class="riga-apri" data-apri="${id}" aria-expanded="${String(aperto)}"${aperto ? ` aria-controls="prezzi-${id}"` : ''}>
      <span class="prezzo">${formattaCifre(voce.euro)}</span>
      <span class="chi"><span class="nome">${esc(nomeDi(voce))}</span>
        <span class="dove">${esc(indirizzoBreve(voce.distributore.indirizzo, voce.distributore.comune.nome))}</span></span>
      ${quandoOVecchio(voce)}
    </button>
    ${navigaIcona(voce, app)}
    ${aperto ? `<div class="riga-dettagli">${disegnaPrezzi(voce.distributore, opzioni.carburante, `prezzi-${id}`)}${naviga(voce, app, false)}</div>` : ''}
  </li>`;
}

export interface OpzioniVista {
  carburante: Categoria;
  raggioKm: number;
  ordine: Ordine;
  /** le voci già nell'ordine scelto */
  voci: readonly Voce[];
  /** quale app apre Naviga e se spiegarlo (solo finché non è mai stato usato) */
  navigazione: { app: AppMappe; conNota: boolean };
  /** il distributore aperto, se c'è (uno alla volta) */
  aperto?: number;
  /** da dove partono le distanze, se non da te: "da Gallarate", "dal centro della mappa" */
  da?: string;
}

/** "entro 5 km", "entro 5 km da Gallarate", "entro 5 km dal centro della mappa" */
function entro(opzioni: OpzioniVista): string {
  return `entro ${String(opzioni.raggioKm)} km${opzioni.da ? ` ${esc(opzioni.da)}` : ''}`;
}

export function disegnaLista(lista: Lista, opzioni: OpzioniVista): string {
  const { migliore, media } = lista;
  if (!migliore) {
    // Testo del passo 11, con il bottone per allargare al raggio successivo (se c'è)
    const piuLargo = RAGGI_KM.find((r) => r > opzioni.raggioKm);
    return `<div class="messaggio" role="status">${icona('cerca')}<div>
      <p>Nessun distributore ${entro(opzioni)}.</p>
      ${piuLargo ? `<button type="button" class="bottone" data-allarga="${String(piuLargo)}">Allarga a ${String(piuLargo)} km</button>` : ''}
      </div></div>`;
  }
  const altri = opzioni.voci.filter((v) => v !== migliore);
  const quanti = lista.voci.length;
  return `<section class="lista" aria-label="Distributori">
    ${eroe(migliore, media, unitaDi(opzioni.carburante), opzioni)}
    <div class="lista-testa">
      <p>${String(quanti)} ${quanti === 1 ? 'distributore' : 'distributori'} ${entro(opzioni)}</p>
      <button type="button" class="ordina" data-ordina aria-label="Ordina per ${opzioni.ordine === 'prezzo' ? 'distanza' : 'prezzo'}">
        ${icona('ordina')}${opzioni.ordine === 'prezzo' ? 'Per prezzo' : 'Per distanza'}
      </button>
    </div>
    <ol class="righe">${altri.map((v) => riga(v, opzioni)).join('')}</ol>
  </section>`;
}

/**
 * Il riquadro in basso sulla mappa (decisione del 19/11/2026): niente velo, la mappa resta visibile.
 * Nome e distanza, prezzo grande, confronto con la media, "Tutti i prezzi" e Naviga.
 */
export function disegnaRiquadro(
  voce: Voce,
  media: number,
  opzioni: { carburante: Categoria; app: AppMappe; tutti: boolean },
): string {
  const id = String(voce.distributore.id);
  const comune = voce.distributore.comune.nome;
  return `<div class="riquadro-testa fascia-${voce.fascia}${voce.vecchio ? ' e-vecchio' : ''}">
      <div>
        <p class="chi">${esc(nomeDi(voce))} · ${formattaKm(voce.km)}</p>
        <p class="prezzo">${formattaCifre(voce.euro)}<span class="unita"> €/${unitaDi(opzioni.carburante)}</span></p>
      </div>
      <button type="button" class="chiudi-riquadro" data-chiudi-riquadro aria-label="Chiudi">${icona('chiudi')}</button>
    </div>
    <p class="dove">${esc(indirizzoBreve(voce.distributore.indirizzo, comune))}</p>
    ${voce.vecchio ? `<p class="dove vecchio">${icona('prezzoVecchio')}Prezzo comunicato il ${giornoBreve(voce.comunicato)}</p>` : ''}
    ${confronto(voce.euro - media)}
    <div class="riquadro-azioni">${bottoneDettagli(voce, opzioni.tutti)}${naviga(voce, opzioni.app, false)}</div>
    ${opzioni.tutti ? disegnaPrezzi(voce.distributore, opzioni.carburante, `prezzi-${id}`) : ''}`;
}
