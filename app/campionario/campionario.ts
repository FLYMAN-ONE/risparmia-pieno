// Campionario delle opzioni di design (ux-design.md, passi 2-6). Pagina di prova, non è l'app.
import { CAMPIONE } from './dati.ts';

type Voce = (typeof CAMPIONE.gasolio)[number];

const html = document.documentElement;
const main = document.querySelector<HTMLElement>('main')!;
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const formato = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const euro = (n: number) => formato.format(n);
const differenza = (n: number) =>
  `${n < 0 ? '−' : '+'}${new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))} €`;
const titolo = (s: string) => s.toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (m) => m.toUpperCase());
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

const lista = CAMPIONE.gasolio;
const media = lista.reduce((s, v) => s + v.euro, 0) / lista.length;

/** Opzione 1 del passo 4: tre fasce, dal più economico al più caro. Stesso prezzo = stessa fascia. */
const ordinati = lista.map((v) => v.euro).sort((a, b) => a - b);
const soglia1 = ordinati[Math.floor(ordinati.length / 3)]!;
const soglia2 = ordinati[Math.floor((2 * ordinati.length) / 3)]!;
function fascia(indice: number, _totale: number): Fascia {
  const v = lista[indice]!.euro;
  return v < soglia1 ? 'conveniente' : v < soglia2 ? 'media' : 'caro';
}

function prezzo(v: number, unita = '€/l'): string {
  return `<span class="prezzo">${euro(v)}<span class="unita"> ${unita}</span></span>`;
}

function eroe(v: Voce): string {
  return `<div class="eroe">
    <span class="etichetta">Il più conveniente</span>
    ${prezzo(v.euro)}
    <div class="chi">${esc(v.bandiera)} · ${String(v.km).replace('.', ',')} km</div>
    <div class="dove">${esc(titolo(v.indirizzo))}</div>
    <div class="delta"><b>${differenza(v.euro - media)}</b> rispetto alla media della zona</div>
  </div>`;
}

type Fascia = 'conveniente' | 'media' | 'caro';
/** Regola proposta: distanza dalla media in centesimi. */
function fasciaCentesimi(v: number): Fascia {
  const diff = v - media;
  return diff <= -0.01 ? 'conveniente' : diff >= 0.01 ? 'caro' : 'media';
}

function righe(voci: readonly Voce[], conDelta = false, regola: 'terzi' | 'centesimi' = 'terzi'): string {
  return voci
    .map((v) => {
      const i = lista.indexOf(v);
      const f = regola === 'terzi' ? fascia(i, lista.length) : fasciaCentesimi(v.euro);
      return `<div class="riga fascia-${f}">
        <span class="prezzo">${euro(v.euro)}</span>
        <span class="chi">${esc(v.bandiera)}</span>
        ${conDelta ? `<span class="segno">${differenza(v.euro - media)}</span>` : ''}
        <span class="km">${String(v.km).replace('.', ',')} km</span>
      </div>`;
    })
    .join('');
}

const dataBreve = CAMPIONE.dataEstrazione.slice(8, 10) + '/' + CAMPIONE.dataEstrazione.slice(5, 7);
const barraAlta = `<span class="filtro">Gasolio ▾</span><span class="filtro">5 km ▾</span><span class="data">Prezzi del ${dataBreve}, ore 8</span>`;
const [primo, ...altri] = lista;

// ——— Passo 2: layout ———
$('[data-layout-a]').innerHTML = `
  <div class="alto">${barraAlta}</div>
  <div class="corpo">${eroe(primo!)}${righe(altri.slice(0, 7))}</div>
  <div class="basso"><button class="bottone">Intorno a me</button><button class="bottone secondario">Mappa</button></div>`;

const posizioni = [
  [62, 30], [30, 22], [78, 44], [22, 40], [48, 18], [85, 24],
] as const;
$('[data-layout-b]').innerHTML = `
  <div class="mappa"></div>
  <span class="tu" style="left:50%;top:34%"></span>
  ${posizioni
    .map(([x, y], i) => {
      const v = lista[i * 5] ?? lista[0]!;
      return `<span class="segnaposto fascia-${fascia(i * 5, lista.length)}" style="left:${x}%;top:${y}%">${prezzo(v.euro, '')}</span>`;
    })
    .join('')}
  <div class="alto galleggiante">${barraAlta}</div>
  <div class="pannello">
    <div class="maniglia"></div>
    <div class="righe">${righe(lista.slice(0, 4))}</div>
    <div class="basso"><button class="bottone">Intorno a me</button><button class="bottone secondario">Cerca</button></div>
  </div>`;

// ——— Passo 4: fasce di colore ———
$('[data-fasce]').innerHTML = eroe(primo!) + righe(altri, true);
$('[data-fasce-centesimi]').innerHTML = eroe(primo!) + righe(altri, true, 'centesimi');

// ——— Passo 5: confronto font ———
const font = [
  ['barlow', 'Barlow · prezzi in Semi Condensed'],
  ['titillium', 'Titillium Web'],
  ['atkinson', 'Atkinson Hyperlegible Next'],
] as const;
$('[data-font-confronto]').innerHTML = font
  .map(
    ([id, nome]) => `<div data-font="${id}" style="font-family:var(--font-testo)">
      <h3>${nome}</h3>
      <div class="eroe">${prezzo(primo!.euro)}<div class="chi">${esc(primo!.bandiera)} · Via Torino</div></div>
      <div class="colonna">${[1.111, 2.18, 2.197, 1.909, 0.849]
        .map((n) => `<span class="prezzo">${euro(n)}</span>`)
        .join('')}</div>
      <p style="margin:12px 0 0">Distributori aperti a Gallarate: indirizzo, orari e prezzi.</p>
    </div>`,
  )
  .join('');

// ——— Passo 6: scala tipografica ———
$('[data-scala]').innerHTML = [
  ['Prezzo eroe · 52 px', `<span class="prezzo" style="font-size:var(--t-eroe);line-height:1">${euro(primo!.euro)}</span>`],
  ['Prezzo in lista · 27 px', `<span class="prezzo" style="font-size:var(--t-lista)">${euro(altri[0]!.euro)}</span>`],
  ['Nome · 17 px Medium', `<span style="font-weight:500">${esc(altri[0]!.bandiera)} · ${esc(titolo(altri[0]!.nome))}</span>`],
  ['Testo · 17 px', esc(titolo(altri[0]!.indirizzo))],
  ['Dettagli · 14 px', `<span style="font-size:var(--t-dettaglio);color:var(--testo-2)">${String(altri[0]!.km).replace('.', ',')} km · prezzo comunicato il ${altri[0]!.comunicato.slice(8, 10)}/${altri[0]!.comunicato.slice(5, 7)}</span>`],
  ['Minimo · 13 px', `<span style="font-size:var(--t-minimo);color:var(--testo-2)">Dati MIMIT, licenza IODL 2.0</span>`],
]
  .map(([cosa, esempio]) => `<div class="scala-riga"><span class="cosa">${cosa}</span><span>${esempio}</span></div>`)
  .join('');

const [interi, decimali] = euro(primo!.euro).split(',');
$('[data-terza-cifra]').innerHTML = `
  <div><p class="nota">Tutte uguali</p><span class="prezzo">${interi},${decimali}</span></div>
  <div><p class="nota">Terza cifra più piccola</p><span class="prezzo">${interi},${decimali!.slice(0, 2)}<span class="piccola">${decimali!.slice(2)}</span></span></div>`;

$('[data-data]').textContent = `${dataBreve}/${CAMPIONE.dataEstrazione.slice(0, 4)}`;

// ——— Campioni di colore con il contrasto calcolato ———
function luminanza(colore: string): number {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.fillStyle = colore;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
}
function contrasto(a: string, b: string): number {
  const [l1, l2] = [luminanza(a), luminanza(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

const ruoli = [
  ['--testo', 'Testo'],
  ['--testo-2', 'Testo secondario'],
  ['--azione-testo', 'Azione (come testo)'],
  ['--conveniente', 'Conveniente'],
  ['--media', 'Nella media'],
  ['--caro', 'Caro'],
  ['--cifre', 'Cifre del prezzo'],
] as const;

function aggiornaCampioni(): void {
  const stile = getComputedStyle(html);
  const sfondo = stile.getPropertyValue('--sfondo').trim();
  const superficie = stile.getPropertyValue('--superficie').trim();
  $('[data-campioni]').innerHTML =
    `<li><span class="colore" style="background:${sfondo}"></span>Sfondo</li>` +
    `<li><span class="colore" style="background:${superficie}"></span>Superficie</li>` +
    ruoli
      .map(([variabile, nome]) => {
        const stileCampioni = getComputedStyle($('[data-campioni]'));
        const colore =
          stileCampioni.getPropertyValue(variabile).trim() || stileCampioni.getPropertyValue('--azione').trim();
        const c = contrasto(colore, superficie);
        return `<li><span class="colore" style="background:${colore}"></span>
          <span>${nome}<br><span class="ok">${c.toFixed(1).replace('.', ',')}:1 ${c >= 4.5 ? '✓' : '✗ sotto 4,5'}</span></span></li>`;
      })
      .join('') +
    (() => {
      const c = contrasto(stile.getPropertyValue('--su-azione').trim(), stile.getPropertyValue('--azione').trim());
      return `<li><span class="colore" style="background:var(--azione)"></span>
        <span>Bottone (testo sopra)<br><span class="ok">${c.toFixed(1).replace('.', ',')}:1 ${c >= 4.5 ? '✓' : '✗ sotto 4,5'}</span></span></li>`;
    })();
}

// ——— Barra delle opzioni ———
const nomiPalette = { A: '“Segnaletica”', B: '“Totem”', C: '“Risparmio”' } as const;
function applica(): void {
  const scelta = (nome: string) => $<HTMLSelectElement>(`[data-scelta="${nome}"]`).value;
  const palette = scelta('palette') as keyof typeof nomiPalette;
  html.dataset['palette'] = palette;
  html.dataset['tema'] = scelta('tema');
  html.dataset['font'] = scelta('font');
  main.dataset['vista'] = scelta('vista');
  $('[data-nome-palette]').textContent = `${palette} ${nomiPalette[palette]}`;
  $('[data-avviso-totem]').hidden = !(palette === 'B' && scelta('tema') === 'chiaro');
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', getComputedStyle(html).getPropertyValue('--sfondo').trim());
  aggiornaCampioni();
}
for (const select of document.querySelectorAll('[data-scelta]')) select.addEventListener('change', applica);

// Il tema parte da quello del telefono
if (matchMedia('(prefers-color-scheme: dark)').matches) {
  $<HTMLSelectElement>('[data-scelta="tema"]').value = 'scuro';
}
applica();
