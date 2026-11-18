import { formattaPrezzo } from './lista/prezzo.ts';

// Pagina provvisoria: serve solo a verificare che l'impianto funzioni.
const esempio = document.querySelector<HTMLElement>('#esempio');
if (esempio) {
  esempio.textContent = `Esempio di prezzo: ${formattaPrezzo(1.689, 'l')}`;
}
