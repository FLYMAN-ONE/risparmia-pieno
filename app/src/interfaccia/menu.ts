// Menu compatto che si apre sotto la pillola toccata (decisione del 19/11/2026).
// Cresce dalla pillola in 150 ms, si chiude in 100 ms: dopo una scelta, toccando altrove o con Esc.
// Niente velo scuro: la pagina resta visibile e calma.

interface MenuAperto {
  elemento: HTMLElement;
  pillola: HTMLElement;
  alTocco: (bersaglio: Element) => void;
  allaChiusura?: () => void;
}

let aperto: MenuAperto | undefined;

function durata(nome: string): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--${nome}`)) || 0;
}

export function menuAperto(): HTMLElement | undefined {
  return aperto?.pillola;
}

export function apriMenu(
  pillola: HTMLElement,
  corpo: string,
  alTocco: (bersaglio: Element) => void,
  allaChiusura?: () => void,
): void {
  chiudiMenu(true);
  const elemento = document.createElement('div');
  elemento.className = 'menu';
  elemento.innerHTML = corpo;
  // Il menu sta nello stesso contenitore della pillola, subito sotto di lei
  pillola.parentElement!.append(elemento);
  pillola.setAttribute('aria-expanded', 'true');

  // Se uscirebbe dallo schermo a destra, si allinea al bordo destro della pillola
  const margine = 8;
  if (elemento.getBoundingClientRect().right > document.documentElement.clientWidth - margine) {
    elemento.classList.add('a-destra');
  }

  aperto = { elemento, pillola, alTocco, ...(allaChiusura ? { allaChiusura } : {}) };
  elemento.addEventListener('click', (evento) => aperto?.alTocco(evento.target as Element));
  elemento.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
  // Al fotogramma dopo, parte l'animazione di entrata
  requestAnimationFrame(() => requestAnimationFrame(() => elemento.classList.add('aperto')));
}

/** subito: senza animazione (per esempio quando si apre un altro menu) */
export function chiudiMenu(subito = false): void {
  if (!aperto) return;
  const { elemento, pillola, allaChiusura } = aperto;
  aperto = undefined;
  pillola.removeAttribute('aria-expanded');
  elemento.classList.remove('aperto');
  elemento.classList.add('chiude');
  window.setTimeout(() => elemento.remove(), subito ? 0 : durata('durata-menu-chiusura'));
  allaChiusura?.();
}

/** Tocchi fuori dal menu e tasto Esc chiudono il menu. Da chiamare una volta all'avvio. */
export function preparaMenu(): void {
  document.addEventListener(
    'pointerdown',
    (evento) => {
      if (!aperto) return;
      const bersaglio = evento.target as Node;
      // il tocco sulla pillola stessa la gestisce la pillola (apre/chiude)
      if (aperto.elemento.contains(bersaglio) || aperto.pillola.contains(bersaglio)) return;
      chiudiMenu();
    },
    true,
  );
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && aperto) {
      const { pillola } = aperto;
      chiudiMenu();
      pillola.focus();
    }
  });
}
