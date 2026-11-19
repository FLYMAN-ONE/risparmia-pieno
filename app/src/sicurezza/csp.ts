// La "lista degli invitati" dell'app (Content Security Policy, fase 9): il browser rifiuta
// qualunque script, stile, font o richiesta che non venga da qui. Regola privacy 7 di CLAUDE.md:
// l'unico dominio esterno è quello delle tessere OpenFreeMap; ogni aggiunta va approvata da Giuseppe.
// Va nella pagina pubblicata (vite.config.ts): GitHub Pages non permette di mandarla come intestazione.

import { DOMINIO_TESSERE } from '../mappa/stile.ts';

/** Gli unici domini esterni che l'app può contattare (con la barra finale: vale per tutto il sito, solo quello) */
export const DOMINI_ESTERNI = [DOMINIO_TESSERE] as const;

const tessere = DOMINI_ESTERNI.join(' ');

export const REGOLE_CSP: Record<string, string> = {
  // tutto vietato, salvo quello che segue
  'default-src': "'none'",
  // codice: solo i file dell'app (niente codice scritto nella pagina, niente eval)
  'script-src': "'self'",
  // stili: solo i file dell'app
  'style-src': "'self'",
  'font-src': "'self'",
  // immagini: dell'app, della mappa e quelle che MapLibre crea in memoria
  'img-src': `'self' data: blob: ${tessere}`,
  // richieste: il file dei prezzi (stesso sito) e le tessere della mappa
  'connect-src': `'self' ${tessere}`,
  // l'aiutante di MapLibre e il custode (service worker): solo dall'app
  'worker-src': "'self' blob:",
  'manifest-src': "'self'",
  // niente plugin, niente pagine dentro la pagina, nessun modulo che invia dati altrove
  'object-src': "'none'",
  'frame-src': "'none'",
  'base-uri': "'none'",
  'form-action': "'none'",
};

export const CSP = Object.entries(REGOLE_CSP)
  .map(([regola, valore]) => `${regola} ${valore}`)
  .join('; ');
