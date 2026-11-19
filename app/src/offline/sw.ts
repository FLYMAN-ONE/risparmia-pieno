// Il "custode" dell'app (service worker), fase 7. Gira sul telefono, separato dalla pagina:
// - conserva i file dell'app, così si apre anche senza rete e subito;
// - conserva l'ultimo file dei prezzi e, a ogni apertura, controlla se sul sito ce n'è uno nuovo;
// - quando esce una versione nuova dell'app la scarica da solo: si vede dall'apertura successiva.
// Non vede mai la posizione e non conserva le tessere della mappa (regola privacy 2).
import { CACHE_PREZZI, cacheDaTogliere, FILE_PREZZI, PREFISSO_CACHE_APP, prezziCambiati, tipoDiRichiesta } from './regole.ts';

// Li scrive la costruzione dell'app (vite.config.ts): l'elenco dei file e la loro impronta
const FILE_APP = JSON.parse('__ELENCO_FILE_APP__') as string[];
const CACHE_APP = `${PREFISSO_CACHE_APP}__VERSIONE_APP__`;

// Le poche parti del service worker che servono qui (TypeScript le conosce solo per i worker)
interface EventoEstendibile extends Event {
  waitUntil(promessa: Promise<unknown>): void;
}
interface EventoRichiesta extends EventoEstendibile {
  request: Request;
  respondWith(risposta: Promise<Response>): void;
}
interface Custode {
  registration: { scope: string };
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void>; matchAll(): Promise<{ postMessage(messaggio: unknown): void }[]> };
  addEventListener(tipo: 'install' | 'activate', gestore: (evento: EventoEstendibile) => void): void;
  addEventListener(tipo: 'fetch', gestore: (evento: EventoRichiesta) => void): void;
}
const custode = self as unknown as Custode;
const radice = new URL(custode.registration.scope);
const indirizzoPrezzi = new URL(FILE_PREZZI, radice).href;

// Installazione: si conservano i file dell'app e, se non c'è ancora, il file dei prezzi.
// Poi la versione nuova prende subito il posto della vecchia (l'app aperta continua con i suoi file).
custode.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const app = await caches.open(CACHE_APP);
      await app.addAll(FILE_APP.map((f) => new URL(f, radice).href));
      const prezzi = await caches.open(CACHE_PREZZI);
      if (!(await prezzi.match(indirizzoPrezzi))) await prezzi.add(indirizzoPrezzi).catch(() => undefined);
      await custode.skipWaiting();
    })(),
  );
});

custode.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      for (const nome of cacheDaTogliere(await caches.keys(), CACHE_APP)) await caches.delete(nome);
      await custode.clients.claim();
    })(),
  );
});

custode.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET') return;
  const tipo = tipoDiRichiesta(new URL(request.url), radice, request.mode === 'navigate');
  if (tipo === 'pagina') evento.respondWith(pagina(request));
  else if (tipo === 'prezzi') evento.respondWith(prezzi(evento));
  else if (tipo === 'file') evento.respondWith(file(request));
  // 'ignora': la richiesta va per la sua strada, il custode non la vede né la conserva
});

/** La pagina della versione attuale, dal telefono; dalla rete solo se manca */
async function pagina(richiesta: Request): Promise<Response> {
  const app = await caches.open(CACHE_APP);
  return (await app.match(new URL('index.html', radice).href)) ?? fetch(richiesta);
}

/** I file dell'app non cambiano mai (il nome cambia a ogni versione): dal telefono se ci sono */
async function file(richiesta: Request): Promise<Response> {
  const conservato = await caches.match(richiesta);
  if (conservato) return conservato;
  const risposta = await fetch(richiesta);
  if (risposta.ok) await (await caches.open(CACHE_APP)).put(richiesta, risposta.clone());
  return risposta;
}

/**
 * I prezzi: subito quelli conservati (l'app si apre senza aspettare), e intanto si chiede al sito
 * se c'è un file nuovo. Se c'è, si conserva e si avvisa l'app, che aggiorna la lista.
 * Senza rete restano gli ultimi prezzi.
 */
async function prezzi(evento: EventoRichiesta): Promise<Response> {
  const cassetto = await caches.open(CACHE_PREZZI);
  const conservato = await cassetto.match(indirizzoPrezzi);
  const dallaRete = fetch(indirizzoPrezzi, { cache: 'no-cache' }).then(async (risposta) => {
    if (!risposta.ok) return risposta;
    await cassetto.put(indirizzoPrezzi, risposta.clone());
    if (conservato && prezziCambiati(conservato.headers, risposta.headers)) {
      for (const pagina of await custode.clients.matchAll()) pagina.postMessage({ tipo: 'prezzi-nuovi' });
    }
    return risposta;
  });
  if (!conservato) return dallaRete;
  evento.waitUntil(dallaRete.catch(() => undefined)); // senza rete: nessun problema, restano questi
  return conservato;
}
