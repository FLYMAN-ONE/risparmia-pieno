// Le regole del "custode" dell'app (service worker), separate dal custode stesso così si possono testare.
// Il custode conserva sul telefono SOLO i file dell'app e il file nazionale dei prezzi (uguale per tutti).
// Non conserva mai le tessere della mappa: direbbero quali zone si sono guardate (regola privacy 2).

/** Il file dei prezzi, relativo all'indirizzo dell'app */
export const FILE_PREZZI = 'dati/prezzi.json';
/** Il cassetto dei prezzi: uno solo, sostituito a ogni file nuovo */
export const CACHE_PREZZI = 'prezzi';
/** I cassetti dei file dell'app, uno per versione: "app-<versione>" */
export const PREFISSO_CACHE_APP = 'app-';

export type TipoRichiesta =
  /** la pagina dell'app: dal telefono, subito */
  | 'pagina'
  /** il file dei prezzi: quello conservato subito, e intanto si controlla se ce n'è uno nuovo */
  | 'prezzi'
  /** file dell'app (codice, stile, font, mappa): non cambiano mai, il nome cambia a ogni versione */
  | 'file'
  /** altri domini (le tessere della mappa) o altri file: il custode non li tocca e non li conserva */
  | 'ignora';

export function tipoDiRichiesta(indirizzo: URL, radice: URL, navigazione: boolean): TipoRichiesta {
  if (indirizzo.origin !== radice.origin || !indirizzo.pathname.startsWith(radice.pathname)) return 'ignora';
  const percorso = indirizzo.pathname.slice(radice.pathname.length);
  if (navigazione) return percorso === '' || percorso === 'index.html' ? 'pagina' : 'ignora';
  if (percorso === FILE_PREZZI) return 'prezzi';
  if (percorso.startsWith('assets/')) return 'file';
  return 'ignora';
}

/**
 * I file da conservare subito all'installazione: tutto quello che serve per aprire la lista senza rete.
 * La mappa (MapLibre e il suo aiutante) si conserva solo dopo il primo uso: senza rete, senza tessere, serve a poco.
 */
export function fileDaPrecaricare(fileCostruiti: readonly string[]): string[] {
  return fileCostruiti
    .filter((f) => !/^(dati\/|sw\.js$)/.test(f) && !/^assets\/(mappa|maplibre)/.test(f))
    .sort();
}

/**
 * Quali cassetti dell'app buttare quando arriva una versione nuova: si tiene l'attuale e la precedente
 * (un'app rimasta aperta può ancora chiedere un file della versione vecchia, per esempio la mappa).
 * I cassetti sono in ordine di creazione, dal più vecchio.
 */
export function cacheDaTogliere(nomi: readonly string[], attuale: string): string[] {
  const vecchie = nomi.filter((n) => n.startsWith(PREFISSO_CACHE_APP) && n !== attuale);
  return vecchie.slice(0, -1);
}

/** Le intestazioni che dicono se il file sul sito è cambiato */
export interface Intestazioni {
  get(nome: string): string | null;
}

/**
 * Il file dei prezzi arrivato dalla rete è diverso da quello conservato? Lo dicono l'impronta (ETag)
 * o la data di modifica che il sito manda con il file. Se il sito non le manda, non si può dire: no.
 */
export function prezziCambiati(conservato: Intestazioni, nuovo: Intestazioni): boolean {
  for (const nome of ['etag', 'last-modified']) {
    const prima = conservato.get(nome);
    const dopo = nuovo.get(nome);
    if (prima && dopo) return prima !== dopo;
  }
  return false;
}
