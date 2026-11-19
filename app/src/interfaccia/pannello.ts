// Pannello dal basso (passo 8 e 9): sale in 250 ms, scende un po' più in fretta.
// Usa <dialog> del browser: blocca la pagina dietro, chiude con Esc, tiene il fuoco dentro.
// Un solo pannello per tutta l'app: filtri oggi, scheda del distributore domani.

const pannello = (): HTMLDialogElement => document.querySelector<HTMLDialogElement>('[data-pannello]')!;

let allaChiusura: (() => void) | undefined;
let alTocco: ((bersaglio: Element) => void) | undefined;
let chiusuraInCorso: number | undefined;
let salitaInCorso: number | undefined;

/** Millisecondi di un token di durata, letto dal file dei token ("200ms" → 200). */
function durata(nome: string): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--${nome}`)) || 0;
}

export interface OpzioniPannello {
  titolo: string;
  corpo: string;
  /** chiamata a ogni tocco dentro il pannello */
  alTocco?: (bersaglio: Element) => void;
  /** chiamata quando il pannello si è chiuso (per rimettere il fuoco su chi l'ha aperto) */
  allaChiusura?: () => void;
}

export function apriPannello(opzioni: OpzioniPannello): void {
  const p = pannello();
  window.clearTimeout(chiusuraInCorso);
  chiusuraInCorso = undefined;
  p.querySelector('[data-pannello-titolo]')!.textContent = opzioni.titolo;
  p.querySelector('[data-pannello-corpo]')!.innerHTML = opzioni.corpo;
  alTocco = opzioni.alTocco;
  allaChiusura = opzioni.allaChiusura;
  if (!p.open) p.showModal();
  // Il fuoco va sulla scelta attuale, se c'è (comodo con tastiera e VoiceOver)
  p.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  // Al fotogramma dopo, il pannello parte da sotto lo schermo e sale
  salitaInCorso = requestAnimationFrame(() => {
    salitaInCorso = requestAnimationFrame(() => p.classList.add('aperto'));
  });
}

export function chiudiPannello(): void {
  const p = pannello();
  if (!p.open || chiusuraInCorso !== undefined) return;
  // se stava ancora per salire, non sale più: si chiude e basta
  if (salitaInCorso !== undefined) cancelAnimationFrame(salitaInCorso);
  salitaInCorso = undefined;
  p.classList.remove('aperto');
  chiusuraInCorso = window.setTimeout(() => {
    chiusuraInCorso = undefined;
    p.close();
    const fatto = allaChiusura;
    allaChiusura = undefined;
    alTocco = undefined;
    fatto?.();
  }, durata('durata-chiusura'));
}

export function preparaPannello(): void {
  const p = pannello();
  p.addEventListener('click', (evento) => {
    const bersaglio = evento.target as Element;
    // Tocco sul velo scuro (fuori dal contenuto) o sulla X: chiude
    if (bersaglio === p || bersaglio.closest('[data-pannello-chiudi]')) {
      chiudiPannello();
      return;
    }
    alTocco?.(bersaglio);
  });
  // Esc: chiude con la stessa animazione invece che di colpo
  p.addEventListener('cancel', (evento) => {
    evento.preventDefault();
    chiudiPannello();
  });
}
