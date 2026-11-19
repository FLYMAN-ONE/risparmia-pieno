// Carica il file nazionale dei prezzi. È uguale per tutti e sta sullo stesso sito dell'app,
// quindi scaricarlo non rivela nulla su dove si trova chi lo usa.
import { decodifica, type DatiPrezzi, type FilePrezzi } from '../../../condiviso/formato.ts';

export const INDIRIZZO_PREZZI = './dati/prezzi.json';

export type Esito =
  | { tipo: 'ok'; dati: DatiPrezzi }
  /** rete: il file non è arrivato (offline, sito irraggiungibile); formato: è arrivato ma non si legge */
  | { tipo: 'errore'; motivo: 'rete' | 'formato' };

export async function caricaPrezzi(scarica: typeof fetch = fetch): Promise<Esito> {
  let risposta: Response;
  try {
    // no-cache: chiede sempre al sito se c'è un file più nuovo (se non è cambiato, non lo riscarica)
    risposta = await scarica(INDIRIZZO_PREZZI, { cache: 'no-cache' });
  } catch {
    return { tipo: 'errore', motivo: 'rete' };
  }
  if (!risposta.ok) return { tipo: 'errore', motivo: 'rete' };

  try {
    const file = (await risposta.json()) as FilePrezzi;
    return { tipo: 'ok', dati: decodifica(file) };
  } catch {
    return { tipo: 'errore', motivo: 'formato' };
  }
}
