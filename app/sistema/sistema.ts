// Pagina "sistema di design": mostra i token così come sono nel file token.css.
// Non contiene valori propri: legge tutto dal foglio di stile, quindi resta sempre allineata.
import '../src/stile/font.css';
import '../src/stile/token.css';
import './sistema.css';
import { ICONE, icona, type NomeIcona } from '../src/icone/icone.ts';
import { contrasto, MINIMO_AA } from '../src/stile/contrasto.ts';

const contenuto = document.querySelector<HTMLElement>('#contenuto')!;
const numero = (n: number, cifre = 1) =>
  new Intl.NumberFormat('it-IT', { minimumFractionDigits: cifre, maximumFractionDigits: cifre }).format(n);

/** Il valore di un token letto dalla pagina, eventualmente dentro un tema forzato. */
function token(nome: string, dentro: Element = document.documentElement): string {
  return getComputedStyle(dentro).getPropertyValue(`--${nome}`).trim();
}

const TEMI = [
  ['chiaro', 'Chiaro'],
  ['scuro', 'Scuro'],
] as const;

/** Ripete lo stesso contenuto nei due temi, affiancati. */
function neiDueTemi(titolo: string, corpo: (tema: string) => string): string {
  return `<h2>${titolo}</h2><div class="temi">${TEMI.map(
    ([tema, nome]) => `<section class="tema" data-tema="${tema}"><h3>${nome}</h3>${corpo(tema)}</section>`,
  ).join('')}</div>`;
}

// ——— Colori ———
const COLORI: [string, string, string][] = [
  // nome, ruolo, su quale sfondo si legge
  ['sfondo', 'Sfondo', ''],
  ['superficie', 'Superficie (pannelli, righe)', ''],
  ['testo', 'Testo', 'superficie'],
  ['testo-2', 'Testo secondario', 'superficie'],
  ['cifre', 'Cifre del prezzo', 'superficie'],
  ['azione', 'Bottone principale', ''],
  ['su-azione', 'Testo sul bottone', 'azione'],
  ['azione-testo', 'Link e bottoni secondari', 'superficie'],
  ['conveniente', 'Prezzo conveniente', 'superficie'],
  ['media', 'Prezzo nella media', 'superficie'],
  ['caro', 'Prezzo caro', 'superficie'],
  ['posizione', 'Tu sei qui (mappa)', ''],
];

function voto(tema: string, nome: string, sfondo: string): string {
  if (!sfondo) return '';
  const el = document.querySelector(`[data-tema="${tema}"]`)!;
  const valore = contrasto(token(nome, el), token(sfondo, el));
  const ok = valore >= MINIMO_AA;
  return `<span class="voto${ok ? '' : ' ko'}">${numero(valore)}:1<br>${ok ? 'AA ok' : 'sotto AA'}</span>`;
}

contenuto.innerHTML += neiDueTemi(
  'Colori',
  (tema) =>
    `<ul class="colori" data-colori="${tema}">${COLORI.map(
      ([nome, ruolo, sfondo]) =>
        `<li><span class="campione" style="background: var(--${nome})"></span>
         <span><b>${ruolo}</b><code>--${nome}</code> <code data-valore="${nome}"></code></span>
         <span data-voto="${nome}" data-su="${sfondo}"></span></li>`,
    ).join('')}</ul>`,
);

// ——— Prezzi ———
const orologio = icona('prezzoVecchio');
contenuto.innerHTML += neiDueTemi(
  'Prezzi',
  () => `
  <div class="eroe">
    <div class="etichetta">Il più conveniente</div>
    <span class="prezzo">1,629<span class="unita"> €/l</span></span>
    <div class="chi">Q8 · 1,2 km</div>
    <div class="delta"><b>−0,04 €</b> rispetto alla media</div>
  </div>
  <div class="righe">
    <div class="riga conveniente"><span class="prezzo">1,649</span><span class="chi">Eni</span><span class="km">2,4 km</span></div>
    <div class="riga media"><span class="prezzo">1,669</span><span class="chi">IP</span><span class="km">0,8 km</span></div>
    <div class="riga caro"><span class="prezzo">1,699</span><span class="chi">Tamoil</span><span class="km">3,1 km</span></div>
    <div class="riga media e-vecchio"><span class="prezzo">1,665</span><span class="chi">Indipendente</span><span class="vecchio">${orologio}09/11</span></div>
  </div>
  <div class="bottoni">
    <button class="bottone">${icona('intornoAMe')}Intorno a me</button>
    <button class="bottone secondario">${icona('naviga')}Naviga</button>
  </div>`,
);

// ——— Font e scala tipografica ———
const SCALA: [string, string, string][] = [
  ['t-eroe', 'Prezzo eroe', '<span class="prezzo" style="font-size: var(--t-eroe)">1,629</span>'],
  ['t-lista', 'Prezzo in lista', '<span class="prezzo" style="font-size: var(--t-lista)">1,649</span>'],
  ['t-normale', 'Nome (SemiBold)', '<span style="font-weight: var(--peso-medio)">Enilive Via Gallarate</span>'],
  ['t-normale', 'Testo', 'Via Gallarate 120, Milano'],
  ['t-dettaglio', 'Dettagli', '<span style="font-size: var(--t-dettaglio)">2,4 km · Prezzi del 19/11, ore 8</span>'],
  ['t-minimo', 'Note legali', '<span style="font-size: var(--t-minimo)">Dati MIMIT, licenza IODL 2.0</span>'],
];
contenuto.innerHTML += `<h2>Font e scala tipografica</h2>
  <p class="nota">Titillium Web: Regular 400, SemiBold 600, Bold 700 per i prezzi. 1rem = 17 px e cresce col testo del telefono.</p>
  <div class="scala">${SCALA.map(
    ([nome, cosa, esempio]) =>
      `<div><span class="cosa">${cosa}<br>--${nome} · <span data-px="${nome}"></span></span><span>${esempio}</span></div>`,
  ).join('')}</div>`;

// ——— Spazi, raggi, ombra ———
const SPAZI = ['s-1', 's-2', 's-3', 's-4', 's-6', 's-8', 'margine', 'tocco-min'];
contenuto.innerHTML += `<h2>Spazi (griglia a 4 px)</h2>
  <div class="spazi">${SPAZI.map(
    (nome) => `<div><span>--${nome} · <span data-valore-radice="${nome}"></span></span><span class="barra" style="width: var(--${nome})"></span></div>`,
  ).join('')}</div>
  <h2>Raggi e ombra</h2>
  <div class="forme">
    <div class="forma" style="border-radius: var(--raggio-bottone)">Bottone<br>--raggio-bottone</div>
    <div class="forma" style="border-radius: var(--raggio-pannello) var(--raggio-pannello) 0 0; box-shadow: var(--ombra-pannello)">Pannello dal basso, con l'unica ombra<br>--raggio-pannello</div>
    <div class="forma" style="border-radius: var(--raggio-etichetta); box-shadow: var(--ombra-mappa)">Etichetta sulla mappa<br>--raggio-etichetta</div>
    <div class="forma" style="border-radius: 0">Riga della lista: nessun angolo</div>
  </div>`;

// ——— Icone ———
contenuto.innerHTML += `<h2>Icone (Lucide)</h2>
  <div class="icone">${(Object.keys(ICONE) as NomeIcona[])
    .map((nome) => `<div>${icona(nome)}<span>${nome}</span></div>`)
    .join('')}</div>`;

// ——— Movimento ———
contenuto.innerHTML += `<h2>Movimento</h2>
  <p class="nota">Il pannello sale in <span data-valore-radice="durata-pannello"></span>.
  Con "Riduci movimento" attivo sul telefono compare subito.</p>
  <div class="pista"><div class="foglio"></div></div>
  <div class="bottoni"><button class="bottone secondario" data-prova-pannello>Apri e chiudi il pannello</button></div>`;

// ——— Tutti i valori, in tabella ———
const ALTRI = [
  'font-testo', 'font-prezzo', 'peso-normale', 'peso-medio', 'peso-prezzo', 'interlinea',
  'larghezza-max', 'raggio-pillola', 'ombra-pannello', 'ombra-mappa',
  'durata-pannello', 'durata-lista', 'curva', 'focus', 'focus-distanza', 'opacita-vecchio', 'filtro-mappa',
];
contenuto.innerHTML += `<h2>Altri valori</h2>
  <table class="valori"><tbody>${ALTRI.map(
    (nome) => `<tr><td>--${nome}</td><td><code data-valore-radice="${nome}"></code></td></tr>`,
  ).join('')}</tbody></table>`;

// ——— Riempie i valori letti dalla pagina ———
for (const el of document.querySelectorAll<HTMLElement>('[data-valore]')) {
  el.textContent = token(el.dataset['valore']!, el);
}
for (const el of document.querySelectorAll<HTMLElement>('[data-voto]')) {
  const tema = el.closest<HTMLElement>('[data-tema]')!.dataset['tema']!;
  el.outerHTML = voto(tema, el.dataset['voto']!, el.dataset['su']!);
}
for (const el of document.querySelectorAll<HTMLElement>('[data-valore-radice]')) {
  el.textContent = token(el.dataset['valoreRadice']!);
}
const pxBase = parseFloat(getComputedStyle(document.documentElement).fontSize);
for (const el of document.querySelectorAll<HTMLElement>('[data-px]')) {
  const rem = parseFloat(token(el.dataset['px']!));
  el.textContent = `${Math.round(rem * pxBase)} px`;
}

const foglio = document.querySelector<HTMLElement>('.foglio')!;
document.querySelector('[data-prova-pannello]')!.addEventListener('click', () => foglio.classList.toggle('su'));
