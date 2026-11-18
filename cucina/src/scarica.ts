/** Indirizzi ufficiali dei due file MIMIT (Osservaprezzi Carburanti, licenza IODL 2.0). */
export const URL_ANAGRAFICA =
  'https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv';
export const URL_PREZZI = 'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv';

/** Tempo massimo di attesa per un download: oltre, si considera fallito. */
const ATTESA_MASSIMA_MS = 120_000;

/**
 * Scarica un file di testo. Se il server risponde con un errore,
 * o se non risponde in tempo, si ferma con un messaggio chiaro.
 * `scaricatore` si può sostituire nei test, per non usare la rete.
 */
export async function scaricaTesto(
  url: string,
  scaricatore: typeof fetch = fetch,
): Promise<string> {
  const risposta = await scaricatore(url, { signal: AbortSignal.timeout(ATTESA_MASSIMA_MS) });
  if (!risposta.ok) {
    throw new Error(`Download fallito: il server ha risposto ${risposta.status} per ${url}`);
  }
  return await risposta.text();
}
