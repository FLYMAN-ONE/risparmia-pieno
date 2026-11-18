// Campionario 2 (ux-design.md, passi 7-11). Pagina di prova, non è l'app.
import { CAMPIONE } from './dati.ts';

const html = document.documentElement;
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const euro = (n: number) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 3 }).format(n);
const km = (n: number) => String(n).replace('.', ',');
const ridotto = () => html.dataset['movimento'] === 'ridotto' || matchMedia('(prefers-reduced-motion: reduce)').matches;

// ——— Icone: stessi significati, due set ———
const lucide = import.meta.glob<string>('./icone/lucide/*.svg', { query: '?raw', import: 'default', eager: true });
const phosphor = import.meta.glob<string>('./icone/phosphor/*.svg', { query: '?raw', import: 'default', eager: true });
const ICONE = {
  naviga: ['navigation', 'navigation-arrow', 'Naviga'],
  locate: ['locate-fixed', 'crosshair', 'Intorno a me'],
  cerca: ['search', 'magnifying-glass', 'Cerca'],
  map: ['map', 'map-trifold', 'Mappa'],
  lista: ['list', 'list', 'Lista'],
  orologio: ['clock', 'clock', 'Prezzo vecchio'],
  impostazioni: ['settings', 'gear', 'Impostazioni'],
  info: ['info', 'info', 'Info'],
  offline: ['wifi-off', 'wifi-slash', 'Offline'],
  apri: ['chevron-down', 'caret-down', 'Scegli'],
  chiudi: ['x', 'x', 'Chiudi'],
  ordina: ['arrow-up-down', 'arrows-down-up', 'Ordina'],
} as const;
type NomeIcona = keyof typeof ICONE;
function svg(nome: NomeIcona): string {
  const [l, p] = ICONE[nome];
  const set = html.dataset['icone'] === 'phosphor' ? phosphor : lucide;
  const file = html.dataset['icone'] === 'phosphor' ? `./icone/phosphor/${p}.svg` : `./icone/lucide/${l}.svg`;
  return (set[file] ?? '').replace('<svg', '<svg aria-hidden="true" focusable="false"');
}
const icona = (nome: NomeIcona) => `<span class="icona">${svg(nome)}</span>`;
function aggiornaIcone(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-icona]')) {
    el.innerHTML = svg(el.dataset['icona'] as NomeIcona);
  }
}

// ——— Forme UE dei carburanti (cerchio benzina, quadrato gasolio e HVO, rombo gas) ———
function formaUE(forma: 'cerchio' | 'quadrato' | 'rombo', sigla: string): string {
  const contorno =
    forma === 'cerchio'
      ? '<circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" stroke-width="2.5"/>'
      : forma === 'quadrato'
        ? '<rect x="3" y="3" width="30" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="2.5"/>'
        : '<rect x="7.4" y="7.4" width="21.2" height="21.2" rx="1.5" transform="rotate(45 18 18)" fill="none" stroke="currentColor" stroke-width="2.5"/>';
  const dimensione = sigla.length > 2 ? 9.5 : 12;
  return `<svg class="forma-ue" viewBox="0 0 36 36" aria-hidden="true">${contorno}
    <text x="18" y="18" text-anchor="middle" dominant-baseline="central" font-size="${dimensione}">${sigla}</text></svg>`;
}
const CARBURANTI = [
  ['Benzina', formaUE('cerchio', 'E10')],
  ['Gasolio', formaUE('quadrato', 'B7')],
  ['HVO', formaUE('quadrato', 'XTL')],
  ['GPL', formaUE('rombo', 'LPG')],
  ['Metano', formaUE('rombo', 'CNG')],
] as const;
$('[data-carburanti]').innerHTML = CARBURANTI.map(
  ([nome, forma]) => `<span class="chip-carburante">${forma}${nome}</span>`,
).join('');

function disegnaIcone(): void {
  $('[data-nome-icone]').textContent = html.dataset['icone'] === 'phosphor' ? 'Phosphor' : 'Lucide';
  $('[data-griglia-icone]').innerHTML = (Object.keys(ICONE) as NomeIcona[])
    .map((n) => `<div>${icona(n)}${ICONE[n][2]}</div>`)
    .join('');
  $('[data-bottoni-prova]').innerHTML = `
    <button class="bottone">${icona('locate')}Intorno a me</button>
    <button class="bottone secondario">${icona('naviga')}Naviga</button>
    <button class="bottone secondario">${icona('map')}Mappa</button>`;
  aggiornaIcone();
}

// ——— Icona dell'app: tre bozze ———
const ASFALTO = '#1C2126';
const AMBRA = '#F5A524';
$('[data-icone-app]').innerHTML = [
  [
    'Cartellone',
    `<svg viewBox="0 0 64 64"><rect width="64" height="64" fill="${ASFALTO}"/>
      <rect x="8" y="14" width="48" height="36" rx="4" fill="#262C32" stroke="#3A424A"/>
      <text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Titillium Web" font-weight="700" font-size="24" fill="${AMBRA}">1,6</text></svg>`,
  ],
  [
    'Goccia',
    `<svg viewBox="0 0 64 64"><rect width="64" height="64" fill="${ASFALTO}"/>
      <path d="M32 9 C32 9 15 30 15 40 a17 17 0 0 0 34 0 C49 30 32 9 32 9Z" fill="${AMBRA}"/>
      <text x="32" y="40" text-anchor="middle" dominant-baseline="central" font-family="Titillium Web" font-weight="700" font-size="20" fill="${ASFALTO}">€</text></svg>`,
  ],
  [
    'Freccia giù',
    `<svg viewBox="0 0 64 64"><rect width="64" height="64" fill="${AMBRA}"/>
      <path d="M32 12 v28 M20 30 l12 12 l12 -12" fill="none" stroke="${ASFALTO}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="18" y="49" width="28" height="5" rx="2.5" fill="${ASFALTO}"/></svg>`,
  ],
]
  .map(([nome, disegno]) => `<figure>${disegno}<span>Risparmia</span><span class="nota">${nome}</span></figure>`)
  .join('');

// ——— Prezzi e colori (decisione del passo 4: centesimi dalla media locale) ———
interface Voce {
  bandiera: string;
  nome: string;
  indirizzo: string;
  km: number;
  euro: number;
  comunicato: string;
}
function fascia(v: number, media: number): 'conveniente' | 'media' | 'caro' {
  const d = v - media;
  return d <= -0.01 ? 'conveniente' : d >= 0.01 ? 'caro' : 'media';
}
function riga(v: Voce, media: number, i: number, vecchio = false): string {
  return `<div class="riga fascia-${fascia(v.euro, media)}${vecchio ? ' e-vecchio' : ''}" data-indice="${i}" data-chiave="${esc(v.nome)}" tabindex="0" role="button">
    <span class="prezzo">${euro(v.euro)}</span>
    <span class="chi">${esc(v.bandiera)}</span>
    ${vecchio ? `<span class="vecchio">${icona('orologio')}09/11</span>` : `<span class="km">${km(v.km)} km</span>`}
  </div>`;
}

// ——— Passo 8: spazi ———
function disegnaSpazi(): void {
  const lista = CAMPIONE.gasolio;
  const media = lista.reduce((s, v) => s + v.euro, 0) / lista.length;
  $('[data-prova-spazi]').innerHTML = `
    <div class="scheda">${lista.slice(0, 3).map((v, i) => riga(v, media, i)).join('')}</div>
    <div class="foglio"><div class="maniglia"></div>
      <h3 style="margin:8px 0 0">${esc(lista[0]!.bandiera)} · ${esc(lista[0]!.nome)}</h3>
      <div class="nota">${esc(lista[0]!.indirizzo)}</div>
      <div class="azioni"><button class="bottone">${icona('naviga')}Naviga</button><button class="bottone secondario">${icona('chiudi')}Chiudi</button></div>
    </div>`;
}
$('[data-griglia-toggle]').addEventListener('click', (e) => {
  const attiva = $('[data-prova-spazi]').classList.toggle('griglia');
  (e.currentTarget as HTMLElement).textContent = attiva ? 'Nascondi la griglia' : 'Mostra la griglia da 4 px';
});

// ——— Passo 9: movimento ———
let carburante: 'gasolio' | 'benzina' = 'gasolio';
function disegnaChips(): void {
  $('[data-chips]').innerHTML = (
    [
      ['gasolio', 'Gasolio', formaUE('quadrato', 'B7')],
      ['benzina', 'Benzina', formaUE('cerchio', 'E10')],
    ] as const
  )
    .map(([id, nome, forma]) => `<button class="chip" data-carburante="${id}" aria-pressed="${id === carburante}">${forma}${nome}</button>`)
    .join('');
}
function disegnaLista(animata: boolean): void {
  const contenitore = $('[data-lista-movimento]');
  // Tecnica FLIP: si ricorda dove stava ogni distributore, si ridisegna e lo si fa scivolare nella nuova posizione
  const prima = new Map<string, number>();
  for (const el of contenitore.querySelectorAll<HTMLElement>('.riga')) prima.set(el.dataset['chiave']!, el.getBoundingClientRect().top);
  const lista = CAMPIONE[carburante].slice(0, 6);
  const media = CAMPIONE[carburante].reduce((s, v) => s + v.euro, 0) / CAMPIONE[carburante].length;
  contenitore.innerHTML = lista.map((v, i) => riga(v, media, i, i === 4)).join('');
  if (!animata || ridotto()) return;
  for (const el of contenitore.querySelectorAll<HTMLElement>('.riga')) {
    const y = prima.get(el.dataset['chiave']!);
    const dopo = el.getBoundingClientRect().top;
    el.animate(
      y === undefined
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ transform: `translateY(${y - dopo}px)` }, { transform: 'translateY(0)' }],
      { duration: 180, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
    );
    el.querySelector('.prezzo')?.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
  }
}
$('[data-chips]').addEventListener('click', (e) => {
  const chip = (e.target as HTMLElement).closest<HTMLElement>('[data-carburante]');
  if (!chip || chip.dataset['carburante'] === carburante) return;
  carburante = chip.dataset['carburante'] as typeof carburante;
  disegnaChips();
  disegnaLista(true);
});

// Pannello dal basso: sale dal basso e torna giù per la stessa strada
const pannello = $('[data-pannello]');
const velo = $('[data-velo]');
let ultimoFocus: HTMLElement | null = null;
function apriScheda(v: Voce): void {
  ultimoFocus = document.activeElement as HTMLElement;
  pannello.innerHTML = `
    <div class="maniglia"></div>
    <button class="chiudi" data-chiudi aria-label="Chiudi">${icona('chiudi')}</button>
    <h2 id="scheda-titolo">${esc(v.bandiera)}</h2>
    <div class="nota">${esc(v.nome)} · ${esc(v.indirizzo)} · ${km(v.km)} km</div>
    <table class="tabella"><tbody>
      <tr><td>Gasolio self</td><td><span class="prezzo">${euro(v.euro)}</span> €/l</td></tr>
      <tr><td>Prezzo comunicato il</td><td>${v.comunicato.slice(8, 10)}/${v.comunicato.slice(5, 7)}</td></tr>
    </tbody></table>
    <button class="bottone" style="width:100%">${icona('naviga')}Naviga</button>`;
  pannello.hidden = false;
  velo.hidden = false;
  requestAnimationFrame(() => {
    pannello.classList.add('aperto');
    velo.classList.add('aperto');
    pannello.querySelector<HTMLElement>('[data-chiudi]')?.focus();
  });
}
function chiudiScheda(): void {
  pannello.classList.remove('aperto');
  velo.classList.remove('aperto');
  const fine = () => {
    if (!pannello.classList.contains('aperto')) {
      pannello.hidden = true;
      velo.hidden = true;
    }
  };
  if (ridotto()) setTimeout(fine, 160);
  else pannello.addEventListener('transitionend', fine, { once: true });
  ultimoFocus?.focus();
}
$('[data-lista-movimento]').addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('.riga');
  if (el) apriScheda(CAMPIONE[carburante][Number(el.dataset['indice'])]!);
});
$('[data-lista-movimento]').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') (e.target as HTMLElement).click();
});
velo.addEventListener('click', chiudiScheda);
pannello.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-chiudi]')) chiudiScheda();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !pannello.hidden) chiudiScheda();
});

// "Intorno a me": il bottone mostra che sta cercando (qui la posizione è simulata, nessun GPS)
$('[data-intorno]').addEventListener('click', (e) => {
  const b = e.currentTarget as HTMLButtonElement;
  if (b.getAttribute('aria-busy') === 'true') return;
  b.setAttribute('aria-busy', 'true');
  $('[data-intorno-testo]').textContent = 'Cerco la posizione…';
  $('[data-intorno-esito]').textContent = '';
  setTimeout(() => {
    b.removeAttribute('aria-busy');
    $('[data-intorno-testo]').textContent = 'Intorno a me';
    $('[data-intorno-esito]').textContent = `Trovati ${CAMPIONE[carburante].length} distributori entro 5 km (posizione simulata).`;
    navigator.vibrate?.(12); // lieve vibrazione quando arriva la risposta (solo Android)
  }, 1400);
});

// ——— Passo 10: mappa, caricata solo al tocco ———
$('[data-carica-mappa]').addEventListener('click', async () => {
  const contenitore = $('[data-contenitore-mappa]');
  contenitore.innerHTML = '<p class="nota">Carico la mappa…</p>';
  const { creaMappa } = await import('./mappa.ts');
  contenitore.innerHTML = '';
  creaMappa(contenitore, () => html.dataset['tema'] === 'scuro', () => (html.dataset['etichette'] === 'gruppi' ? 'gruppi' : 'priorita'));
});

// ——— Passo 11: testi ———
function disegnaMessaggi(): void {
  const d = CAMPIONE.dataEstrazione;
  const data = `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  $('[data-messaggi]').innerHTML = [
    ['info', '', `Prezzi del ${data}, ore 8`, 'In alto, sempre visibile'],
    ['locate', '', 'Posizione non disponibile. Cerca un comune oppure attiva la posizione nelle impostazioni.', 'GPS negato', '<button class="bottone secondario">Cerca un comune</button>'],
    ['cerca', '', 'Nessun distributore entro 5 km.', 'Nessun risultato', '<button class="bottone">Allarga a 10 km</button>'],
    ['offline', '', `Sei offline. Prezzi del ${data}.`, 'Senza rete'],
    ['orologio', 'attenzione', `Prezzi di 2 giorni fa (${data}). L'aggiornamento di oggi non è ancora arrivato.`, 'Dati più vecchi di 36 ore'],
    ['orologio', '', `Prezzo comunicato il 09/11`, 'Prezzo vecchio (oltre 7 giorni), nella lista e nella scheda'],
    ['naviga', '', 'Naviga apre Mappe o Google Maps con la destinazione.', 'Nota sotto il tasto Naviga, la prima volta'],
  ]
    .map(
      ([ic, classe, testo, quando, azione]) => `<div class="messaggio ${classe}">${icona(ic as NomeIcona)}<div>
        <span class="quando">${quando}</span><p>${testo}</p>${azione ?? ''}</div></div>`,
    )
    .join('');
}

// ——— Barra delle opzioni ———
function applica(): void {
  const scelta = (n: string) => $<HTMLSelectElement>(`[data-scelta="${n}"]`).value;
  html.dataset['tema'] = scelta('tema');
  html.dataset['icone'] = scelta('icone');
  html.dataset['movimento'] = scelta('movimento');
  const etichettePrima = html.dataset['etichette'];
  html.dataset['etichette'] = scelta('etichette');
  if (etichettePrima && etichettePrima !== html.dataset['etichette']) window.dispatchEvent(new CustomEvent('etichette-cambiate'));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(html).getPropertyValue('--sfondo').trim());
  disegnaIcone();
  disegnaSpazi();
  disegnaChips();
  disegnaLista(false);
  disegnaMessaggi();
  window.dispatchEvent(new CustomEvent('tema-cambiato'));
}
for (const s of document.querySelectorAll('[data-scelta]')) s.addEventListener('change', applica);
if (matchMedia('(prefers-color-scheme: dark)').matches) $<HTMLSelectElement>('[data-scelta="tema"]').value = 'scuro';
applica();
