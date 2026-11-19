// Testi dei dati MIMIT resi leggibili: molti indirizzi e tutti i comuni arrivano IN MAIUSCOLO.

/** Sigle stradali che restano maiuscole */
const SIGLE = new Set(['SS', 'SP', 'SR', 'SC', 'SNC', 'S.N.C', 'S.N.C.', 'SN', 'S.N.', 'A1', 'A4', 'A8', 'A9']);
/** Parole brevi che restano minuscole in mezzo al nome */
const MINUSCOLE = new Set(['di', 'del', 'della', 'dei', 'delle', 'degli', 'da', 'dal', 'e', 'al', 'alla', 'in', 'sul', 'km']);

function parola(p: string, prima: boolean): string {
  if (SIGLE.has(p)) return p;
  const minuscola = p.toLocaleLowerCase('it-IT');
  if (!prima && MINUSCOLE.has(minuscola.replace(/\.$/, ''))) return minuscola;
  // maiuscola anche dopo l'apostrofo: "SANT'ANGELO" → "Sant'Angelo"
  return minuscola.replace(/(^|['’-])(\p{L})/gu, (_, prima: string, lettera: string) => prima + lettera.toLocaleUpperCase('it-IT'));
}

/** "VIA DELLA REPUBBLICA 12" → "Via della Repubblica 12". Ai testi già misti si mette solo la maiuscola iniziale. */
export function inCaratteriNormali(testo: string): string {
  if (testo !== testo.toLocaleUpperCase('it-IT')) return testo.charAt(0).toLocaleUpperCase('it-IT') + testo.slice(1);
  return testo
    .split(/(\s+)/)
    .map((p, i) => (/^\s+$/.test(p) ? p : parola(p, i === 0)))
    .join('');
}

/** Toglie il CAP finale, che nell'app non serve: "VIA MARCONI 6 21030" → "VIA MARCONI 6" */
export function senzaCap(indirizzo: string): string {
  return indirizzo.replace(/[\s,-]*\b\d{5}\s*$/, '').trim();
}

/** Indirizzo da mostrare: "Via Marconi 6, Gallarate" */
export function indirizzoBreve(indirizzo: string, comune: string): string {
  const via = inCaratteriNormali(senzaCap(indirizzo));
  const citta = inCaratteriNormali(comune);
  return via ? `${via}, ${citta}` : citta;
}

/** Protegge i testi dei dati quando finiscono nella pagina: niente codice nascosto nei nomi. */
export function esc(testo: string): string {
  return testo.replace(/[&<>"']/g, (c) => `&#${String(c.charCodeAt(0))};`);
}
