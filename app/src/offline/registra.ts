// Collega l'app al suo custode (service worker, vedi sw.ts). Solo nella versione pubblicata:
// durante lo sviluppo i file cambiano di continuo e il custode li terrebbe vecchi.

function disponibile(): boolean {
  return import.meta.env.PROD && 'serviceWorker' in navigator;
}

/** Avvia il custode senza rallentare l'apertura; alArrivoPrezziNuovi: il custode ha conservato un file prezzi nuovo */
export function registraCustode(alArrivoPrezziNuovi: () => void): void {
  if (!disponibile()) return;
  navigator.serviceWorker.addEventListener('message', (evento: MessageEvent<{ tipo?: string } | undefined>) => {
    if (evento.data?.tipo === 'prezzi-nuovi') alArrivoPrezziNuovi();
  });
  const registra = () => {
    // updateViaCache 'none': per sapere se c'è una versione nuova si chiede sempre al sito
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => undefined);
  };
  if (document.readyState === 'complete') registra();
  else addEventListener('load', registra, { once: true });
}

/** Chiede al sito se c'è una versione nuova dell'app (per quando l'app torna in primo piano senza riaprirsi) */
export function cercaVersioneNuova(): void {
  if (!disponibile()) return;
  navigator.serviceWorker
    .getRegistration()
    .then((registrazione) => registrazione?.update())
    .catch(() => undefined);
}
