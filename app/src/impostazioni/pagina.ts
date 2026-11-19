// La pagina "Impostazioni e info" (schermata 3 del brief, fase 8): tema, colore della mappa,
// fonte dei dati, nota privacy e versione. Si apre dall'ingranaggio in alto a destra.
// Nessun link esterno: la vista Lista non deve contattare nessun dominio (regola privacy 8).
import { giornoBreve } from '../dati/data.ts';
import { icona } from '../icone/icone.ts';
import type { StileMappa, Tema } from './preferenze.ts';

const NOMI_TEMA: Record<Tema, string> = { automatico: 'Automatico', chiaro: 'Chiaro', scuro: 'Scuro' };
const NOMI_MAPPA: Record<StileMappa, string> = { tema: 'Come il tema', chiara: 'Chiara', blu: 'Blu scura' };

export interface OpzioniImpostazioni {
  tema: Tema;
  mappa: StileMappa;
  /** la data dei prezzi caricati, se ci sono */
  dataPrezzi?: string;
  versione: string;
}

function scelte<T extends string>(nome: string, nomi: Record<T, string>, scelta: T): string {
  return (Object.keys(nomi) as T[])
    .map(
      (valore) => `<label class="segmento">
        <input type="radio" name="${nome}" value="${valore}"${valore === scelta ? ' checked' : ''} />
        <span>${nomi[valore]}</span></label>`,
    )
    .join('');
}

export function disegnaImpostazioni({ tema, mappa, dataPrezzi, versione }: OpzioniImpostazioni): string {
  return `<section class="impostazioni" aria-labelledby="titolo-impostazioni">
    <div class="impostazioni-testa">
      <h1 id="titolo-impostazioni" tabindex="-1">Impostazioni e info</h1>
      <button type="button" class="chiudi-impostazioni" data-chiudi-impostazioni aria-label="Chiudi">${icona('chiudi')}</button>
    </div>

    <fieldset class="gruppo-scelta">
      <legend>Tema</legend>
      <div class="segmenti">${scelte('tema', NOMI_TEMA, tema)}</div>
      <p class="nota">Automatico segue l'impostazione chiaro/scuro del telefono.</p>
    </fieldset>

    <fieldset class="gruppo-scelta">
      <legend>Colore della mappa</legend>
      <div class="segmenti">${scelte('mappa', NOMI_MAPPA, mappa)}</div>
    </fieldset>

    <div class="info">
      <h2>Dati</h2>
      <p>Prezzi: Osservaprezzi Carburanti del Ministero delle Imprese e del Made in Italy (MIMIT), licenza IODL 2.0. Si aggiornano ogni giorno.${
        dataPrezzi ? ` Prezzi del ${giornoBreve(dataPrezzi)}.` : ''
      }</p>
      <p>Mappa: OpenFreeMap, dati © OpenStreetMap.</p>

      <h2>Privacy</h2>
      <p>La tua posizione resta sul telefono: non viene inviata a nessuno e non viene salvata. Niente account, pubblicità o statistiche.</p>
      <p>Il telefono ricorda solo le tue scelte: carburante, self/servito, raggio, tema e colore della mappa. Il file dei prezzi è uguale per tutta Italia, quindi scaricarlo non dice dove sei.</p>

      <h2>Versione</h2>
      <p>${versione}</p>
    </div>
  </section>`;
}
