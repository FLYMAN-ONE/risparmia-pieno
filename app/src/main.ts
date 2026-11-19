// Avvio dell'app: mostra subito la schermata, poi carica i prezzi.
import './stile/font.css';
import './stile/token.css';
import './stile/base.css';
import './stile/struttura.css';
import './stile/lista.css';
import './stile/filtri.css';
import './stile/mappa.css';
import { caricaPrezzi } from './dati/carica.ts';
import { avvisoRitardo } from './dati/data.ts';
import { icona, type NomeIcona } from './icone/icone.ts';
import { cambioDa, disegnaFiltri, disegnaRaggio, disegnaScelte, eUnFiltro, raggioDaPosizione, raggioDaTesto } from './impostazioni/filtri.ts';
import { apriMenu, chiudiMenu, menuAperto, preparaMenu } from './interfaccia/menu.ts';
import { cambiaCarburante, filtriDa, leggiPreferenze, salvaPreferenze, type Filtri, type Preferenze } from './impostazioni/preferenze.ts';
import { RAGGI_KM, type RaggioKm } from './vicini/vicini.ts';
import { carburanteToccato, disegnaSceltaCarburante } from './impostazioni/scelta-carburante.ts';
import { ordina, preparaLista, type Lista, type Ordine } from './lista/lista.ts';
import { unitaDi } from '../../condiviso/carburanti.ts';
import { disegnaLista, disegnaRiquadro } from './lista/vista.ts';
import { appMappeDi } from './navigazione/naviga.ts';
import { chiediPosizione, type Posizione } from './posizione/posizione.ts';
import { entroRaggio, RAGGIO_INIZIALE, spostamentoSignificativo } from './vicini/vicini.ts';
import type { Mappa } from './mappa/mappa.ts';
import type { Comune, DatiPrezzi } from '../../condiviso/formato.ts';
import { cercaComuni } from './ricerca/cerca.ts';
import { disegnaSuggerimenti, nomeComune } from './ricerca/suggerimenti.ts';

const html = document.documentElement;
const avviso = document.querySelector<HTMLElement>('[data-avviso-ritardo]')!;
const contenuto = document.querySelector<HTMLElement>('[data-contenuto]')!;
/** Il testo di partenza, da rimettere quando i prezzi arrivano dopo un errore. */
const invito = contenuto.querySelector<HTMLElement>('.invito')!;
const bottoneIntorno = document.querySelector<HTMLButtonElement>('[data-intorno]')!;
const zonaFiltri = document.querySelector<HTMLElement>('[data-filtri]')!;
const zonaRaggio = document.querySelector<HTMLElement>('[data-raggio]')!;
const vistaMappa = document.querySelector<HTMLElement>('[data-mappa]')!;
const bottoneVista = document.querySelector<HTMLButtonElement>('[data-cambia-vista]')!;
const riquadro = document.querySelector<HTMLElement>('[data-riquadro]')!;
const barraAlta = document.querySelector<HTMLElement>('.barra-alta')!;
const formRicerca = document.querySelector<HTMLFormElement>('[data-ricerca]')!;
const campoRicerca = document.querySelector<HTMLInputElement>('[data-campo-ricerca]')!;
const bottoneCerca = document.querySelector<HTMLButtonElement>('[data-cerca]')!;

// ——— Stato dell'app: tutto solo in memoria, tranne le preferenze ———
/** I prezzi caricati */
let dati: DatiPrezzi | undefined;
/** Il centro dei risultati: la posizione del GPS oppure il comune cercato.
    Solo in questa variabile, finché l'app è aperta. Mai salvata (né la posizione, né il comune). */
let posizione: Posizione | undefined;
/** Il comune cercato, se i risultati sono intorno a un comune e non a te */
let comuneCercato: Comune | undefined;
/** Il centro della mappa, se l'utente l'ha spostata: i risultati sono intorno a quel punto.
    Solo in memoria, come la posizione. */
let centroMappa: Posizione | undefined;
/** La mappa va rimessa sul cerchio del raggio (dopo "Intorno a me", un comune o un raggio nuovo) */
let daInquadrare = true;
/** Le scelte dell'utente (salvate sul telefono, senza la posizione) */
let preferenze: Preferenze = leggiPreferenze();
let ordine: Ordine = 'prezzo';
/** Il distributore con la scheda aperta nella lista (uno alla volta) */
let aperto: number | undefined;
/** Lista o mappa: si parte sempre dalla lista e non si ricorda (passo 2) */
let inMappa = false;
/** La mappa, creata al primo tocco di "Mappa" */
let mappa: Promise<Mappa> | undefined;
/** L'ultima lista calcolata: la mappa mostra gli stessi distributori */
let ultimaLista: Lista | undefined;

/** Il punto da cui partono i risultati: il centro della mappa spostata, oppure la posizione (o il comune). */
function centro(): Posizione | undefined {
  return centroMappa ?? posizione;
}

/** I filtri in uso, se il carburante è già stato scelto. */
function filtri(): Filtri | undefined {
  const { carburante } = preferenze;
  return carburante ? filtriDa({ ...preferenze, carburante }) : undefined;
}

/** I filtri compaiono in alto dopo la scelta del carburante. */
function disegnaBarraFiltri(): void {
  const attuali = filtri();
  zonaFiltri.hidden = !attuali;
  zonaRaggio.hidden = !attuali;
  zonaFiltri.innerHTML = attuali ? disegnaFiltri(attuali) : '';
  zonaRaggio.innerHTML = attuali ? disegnaRaggio(attuali.raggioKm) : '';
}

function disegnaIcone(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-icona]')) {
    el.innerHTML = icona(el.dataset['icona'] as NomeIcona);
  }
}

/** Il colore della barra di stato del telefono segue lo sfondo del tema. */
function coloreBarraDiStato(): void {
  const colore = getComputedStyle(html).getPropertyValue('--superficie').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colore);
}

/** Cosa mostrare quando non c'è (ancora) una lista: la domanda del primo uso o l'invito. */
function mostraPartenza(): void {
  if (!preferenze.carburante) contenuto.innerHTML = disegnaSceltaCarburante();
  else contenuto.replaceChildren(invito);
}

/** La data dei prezzi non si mostra più: compare solo l'avviso se l'aggiornamento è in ritardo. */
function mostraAvvisoRitardo(dataEstrazione: string): void {
  const testo = avvisoRitardo(dataEstrazione, new Date());
  avviso.hidden = !testo;
  avviso.innerHTML = testo ? `${icona('prezzoVecchio')}<span>${testo}</span>` : '';
}

function mostraErrore(): void {
  contenuto.innerHTML = `<div class="messaggio" role="alert">${icona('offline')}<div>
    <p>Prezzi non disponibili. Controlla la connessione e riprova.</p>
    <button type="button" class="bottone secondario" data-riprova>Riprova</button></div></div>`;
}

async function avvia(): Promise<void> {
  const esito = await caricaPrezzi();
  if (esito.tipo === 'errore') {
    mostraErrore();
    return;
  }
  dati = esito.dati;
  mostraAvvisoRitardo(dati.dataEstrazione);
  if (!formRicerca.hidden) mostraSuggerimenti(); // si stava già scrivendo il nome di un comune
  else if (posizione) mostraRisultati();
  else mostraPartenza();
}

// ——— Intorno a me ———
function mostraPosizioneNonDisponibile(): void {
  // Testo e bottone decisi al passo 11
  contenuto.innerHTML = `<div class="messaggio" role="alert">${icona('intornoAMe')}<div>
    <p>Posizione non disponibile. Cerca un comune oppure attiva la posizione nelle impostazioni.</p>
    <button type="button" class="bottone secondario" data-cerca>Cerca un comune</button></div></div>`;
}

async function intornoAMe(): Promise<void> {
  if (bottoneIntorno.getAttribute('aria-busy') === 'true') return; // ignora i tocchi doppi
  chiudiRicerca(false);
  bottoneIntorno.setAttribute('aria-busy', 'true');
  contenuto.innerHTML = '<p class="invito" role="status">Cerco la tua posizione…</p>';

  const esito = await chiediPosizione();
  bottoneIntorno.removeAttribute('aria-busy');
  if (esito.tipo !== 'ok') {
    posizione = undefined;
    comuneCercato = undefined;
    centroMappa = undefined;
    mostraVista(false); // il messaggio sta nella lista
    mostraPosizioneNonDisponibile();
    return;
  }
  posizione = esito.posizione;
  comuneCercato = undefined;
  centroMappa = undefined;
  daInquadrare = true;
  aperto = undefined;
  mostraRisultati();
  void aggiornaMappa(true);
  // lieve vibrazione: risultati pronti (passo 9). Solo Android; il telefono la permette solo subito dopo un tocco.
  if (dati && preferenze.carburante && navigator.userActivation?.isActive) navigator.vibrate?.(10);
}

/** Da dove partono le distanze, se non da te */
function daDove(): string | undefined {
  if (centroMappa) return 'dal centro della mappa';
  return comuneCercato ? `da ${nomeComune(comuneCercato)}` : undefined;
}

function mostraRisultati(sfuma = false): void {
  const punto = centro();
  if (!punto) return;
  if (!dati) {
    // la posizione è arrivata prima dei prezzi: si mostra tutto appena finisce il caricamento
    contenuto.innerHTML = '<p class="invito" role="status">Carico i prezzi…</p>';
    return;
  }
  const attuali = filtri();
  if (!attuali) {
    // primo uso: prima la domanda, poi la lista compare da sola
    contenuto.innerHTML = disegnaSceltaCarburante();
    return;
  }
  const { carburante, modalita, raggioKm } = attuali;
  const da = daDove();
  const lista = preparaLista(entroRaggio(dati.distributori, punto, raggioKm), carburante, modalita);
  ultimaLista = lista;
  contenuto.innerHTML = disegnaLista(lista, {
    carburante,
    raggioKm,
    ordine,
    voci: ordina(lista.voci, ordine),
    navigazione: { app: appMappeDi(navigator.userAgent), conNota: !preferenze.navigaUsato },
    ...(aperto === undefined ? {} : { aperto }),
    ...(da ? { da } : {}),
  });
  if (sfuma) contenuto.querySelector('.righe')?.classList.add('aggiornata');
  disegnaBottoneVista();
  void prezziSullaMappa();
}

// ——— Lista e mappa ———
/** Il bottone Lista/Mappa compare quando c'è una posizione e c'è qualcosa da mostrare. */
function disegnaBottoneVista(): void {
  bottoneVista.hidden = !(posizione && dati && filtri());
  bottoneVista.innerHTML = inMappa ? `${icona('lista')}Lista` : `${icona('mappa')}Mappa`;
}

function mostraVista(mappaSi: boolean): void {
  inMappa = mappaSi;
  contenuto.hidden = inMappa;
  vistaMappa.hidden = !inMappa;
  document.body.classList.toggle('in-mappa', inMappa);
  disegnaBottoneVista();
  if (inMappa) void aggiornaMappa();
  else chiudiRiquadro();
}

/** Il punto blu: sulla tua posizione, ma non quando si guarda un comune cercato (lì non ci sei tu) */
function tuSeiQui(): Posizione | undefined {
  return comuneCercato ? undefined : posizione;
}

/** Accende la mappa (scaricandola la prima volta). La rimette sul cerchio del raggio solo se serve:
    tornando dalla lista resta dove l'avevi lasciata. */
async function aggiornaMappa(vola = false): Promise<void> {
  const punto = centro();
  if (!inMappa || !punto) return;
  const raggioKm = filtri()?.raggioKm ?? RAGGIO_INIZIALE;
  const inquadra = daInquadrare;
  daInquadrare = false;
  if (!mappa) {
    vistaMappa.insertAdjacentHTML('afterbegin', '<p class="caricamento" role="status">Carico la mappa…</p>');
    mappa = import('./mappa/mappa.ts').then(({ creaMappa }) => {
      const nuova = creaMappa(vistaMappa, punto, raggioKm, apriRiquadro, mappaSpostata);
      nuova.puntoBlu(tuSeiQui());
      return nuova;
    });
    void prezziSullaMappa();
    return;
  }
  const pronta = await mappa;
  pronta.puntoBlu(tuSeiQui());
  if (inquadra) pronta.inquadra(punto, raggioKm, vola);
  else pronta.ridimensiona();
}

/** L'utente ha spostato la mappa: i prezzi si ricalcolano intorno al nuovo centro, tutto sul telefono. */
function mappaSpostata(nuovo: Posizione): void {
  const prima = centro();
  const raggioKm = filtri()?.raggioKm;
  if (!prima || !raggioKm || !spostamentoSignificativo(prima, nuovo, raggioKm)) return;
  centroMappa = nuovo;
  aperto = undefined;
  mostraRisultati();
}

/** Passa alla mappa i distributori della lista (dopo ogni cambio di filtro o posizione). */
async function prezziSullaMappa(): Promise<void> {
  const carburante = filtri()?.carburante;
  if (!mappa || !ultimaLista || !carburante) return;
  chiudiRiquadro(); // la lista è cambiata: il distributore scelto potrebbe non esserci più
  (await mappa).mostraPrezzi(ultimaLista.voci, unitaDi(carburante));
}

// ——— Riquadro del distributore sulla mappa ———
/** Il distributore del riquadro (posizione nella lista) e se mostra tutti i prezzi */
let nelRiquadro: { indice: number; tutti: boolean } | undefined;

function disegnaIlRiquadro(): void {
  const voce = nelRiquadro && ultimaLista?.voci[nelRiquadro.indice];
  const carburante = filtri()?.carburante;
  riquadro.hidden = !voce;
  if (!voce || !ultimaLista || !carburante || !nelRiquadro) {
    riquadro.replaceChildren();
    return;
  }
  riquadro.innerHTML = disegnaRiquadro(voce, ultimaLista.media, {
    carburante,
    app: appMappeDi(navigator.userAgent),
    tutti: nelRiquadro.tutti,
  });
}

function apriRiquadro(indice: number | undefined): void {
  if (indice === undefined) {
    chiudiRiquadro();
    return;
  }
  nelRiquadro = { indice, tutti: false };
  disegnaIlRiquadro();
  void mappa?.then((m) => m.evidenzia(indice));
}

function chiudiRiquadro(): void {
  if (!nelRiquadro) return;
  nelRiquadro = undefined;
  disegnaIlRiquadro();
  void mappa?.then((m) => m.evidenzia(undefined));
}

/** Il link apre l'app di navigazione da solo; qui si ricorda solo che la nota non serve più. */
function ricordaNavigaUsato(): void {
  if (preferenze.navigaUsato) return;
  preferenze = { ...preferenze, navigaUsato: true };
  salvaPreferenze(preferenze);
  contenuto.querySelector('.nota-naviga')?.remove();
}

// ——— Ricerca del comune (fase 6): tutta sul telefono ———
/** Quanti distributori ha ogni comune: a parità, nei suggerimenti viene prima il comune più grande */
let distributoriPerComune: Map<Comune, number> | undefined;

function importanza(comune: Comune): number {
  if (!distributoriPerComune && dati) {
    distributoriPerComune = new Map();
    for (const d of dati.distributori) distributoriPerComune.set(d.comune, (distributoriPerComune.get(d.comune) ?? 0) + 1);
  }
  return distributoriPerComune?.get(comune) ?? 0;
}

function apriRicerca(): void {
  chiudiMenu(true);
  mostraVista(false); // i suggerimenti stanno al posto della lista
  barraAlta.classList.add('cerca');
  formRicerca.hidden = false;
  bottoneCerca.setAttribute('aria-expanded', 'true');
  campoRicerca.value = '';
  campoRicerca.focus(); // nello stesso tocco: così l'iPhone apre la tastiera
  mostraSuggerimenti();
}

/** ripristina: torna a quello che c'era prima (risultati o partenza) */
function chiudiRicerca(ripristina = true): void {
  if (formRicerca.hidden) return;
  formRicerca.hidden = true;
  barraAlta.classList.remove('cerca');
  bottoneCerca.removeAttribute('aria-expanded');
  campoRicerca.blur();
  if (!ripristina) return;
  if (posizione) mostraRisultati();
  else mostraPartenza();
}

function suggeriti(): { comune: Comune; indice: number }[] {
  if (!dati) return [];
  const { comuni } = dati;
  return cercaComuni(comuni, campoRicerca.value, importanza).map((comune) => ({ comune, indice: comuni.indexOf(comune) }));
}

function mostraSuggerimenti(): void {
  contenuto.innerHTML = dati ? disegnaSuggerimenti(campoRicerca.value, suggeriti()) : '<p class="invito" role="status">Carico i prezzi…</p>';
}

/** Scelto un comune: risultati come per "Intorno a me", ma intorno al comune */
function scegliComune(indice: number): void {
  const comune = dati?.comuni[indice];
  if (!comune) return;
  chiudiRicerca(false);
  comuneCercato = comune;
  posizione = { lat: comune.lat, lon: comune.lon };
  centroMappa = undefined;
  daInquadrare = true;
  aperto = undefined;
  mostraRisultati();
  void aggiornaMappa(true);
  bottoneCerca.focus({ preventScroll: true });
}

campoRicerca.addEventListener('input', mostraSuggerimenti);
// Invio sulla tastiera: si sceglie il primo suggerimento
formRicerca.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const [primo] = suggeriti();
  if (primo) scegliComune(primo.indice);
});
formRicerca.querySelector('[data-annulla-ricerca]')?.addEventListener('click', () => {
  chiudiRicerca();
  bottoneCerca.focus({ preventScroll: true });
});
bottoneCerca.addEventListener('click', () => (formRicerca.hidden ? apriRicerca() : chiudiRicerca()));

// ——— Tocchi ———
bottoneIntorno.addEventListener('click', () => void intornoAMe());
bottoneVista.addEventListener('click', () => mostraVista(!inMappa));

riquadro.addEventListener('click', (evento) => {
  const bersaglio = evento.target as Element;
  if (bersaglio.closest('[data-chiudi-riquadro]')) chiudiRiquadro();
  else if (bersaglio.closest('[data-apri]') && nelRiquadro) {
    nelRiquadro = { ...nelRiquadro, tutti: !nelRiquadro.tutti };
    disegnaIlRiquadro();
    riquadro.querySelector<HTMLElement>('[data-apri]')?.focus({ preventScroll: true });
  } else if (bersaglio.closest('[data-naviga]')) ricordaNavigaUsato();
});
document.addEventListener('keydown', (evento) => {
  if (evento.key !== 'Escape') return;
  if (!formRicerca.hidden) {
    chiudiRicerca();
    bottoneCerca.focus({ preventScroll: true });
  } else if (nelRiquadro) chiudiRiquadro();
});

contenuto.addEventListener('click', (evento) => {
  const bersaglio = evento.target as Element;
  if (bersaglio.closest('[data-riprova]')) {
    void avvia();
    return;
  }
  const comune = bersaglio.closest<HTMLElement>('[data-comune]');
  if (comune) {
    scegliComune(Number(comune.dataset['comune']));
    return;
  }
  if (bersaglio.closest('[data-cerca]')) {
    apriRicerca();
    return;
  }
  if (bersaglio.closest('[data-naviga]')) {
    ricordaNavigaUsato();
    return;
  }
  const allarga = raggioDaTesto(bersaglio.closest<HTMLElement>('[data-allarga]')?.dataset['allarga']);
  if (allarga) {
    cambiaRaggio(allarga);
    disegnaBarraFiltri(); // lo slider si sposta sul nuovo raggio
    return;
  }
  const apri = bersaglio.closest<HTMLElement>('[data-apri]');
  if (apri) {
    // Apre la scheda di quel distributore (e chiude l'altra), oppure la richiude
    const id = Number(apri.dataset['apri']);
    aperto = aperto === id ? undefined : id;
    mostraRisultati();
    contenuto.querySelector<HTMLElement>(`[data-apri="${String(id)}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (bersaglio.closest('[data-ordina]')) {
    ordine = ordine === 'prezzo' ? 'distanza' : 'prezzo';
    mostraRisultati(true);
    contenuto.querySelector<HTMLElement>('[data-ordina]')?.focus();
    return;
  }
  const carburante = carburanteToccato(evento);
  if (carburante) {
    preferenze = cambiaCarburante(preferenze, carburante);
    salvaPreferenze(preferenze);
    disegnaBarraFiltri();
    if (posizione) mostraRisultati();
    else contenuto.replaceChildren(invito);
  }
});

// Tocco su una pillola: si apre (o si chiude) il menu sotto di lei
zonaFiltri.addEventListener('click', (evento) => {
  const pillola = (evento.target as Element).closest<HTMLElement>('[data-apri-filtro]');
  const nome = pillola?.dataset['apriFiltro'];
  const attuali = filtri();
  if (!pillola || !eUnFiltro(nome) || !attuali) return;
  if (menuAperto() === pillola) {
    chiudiMenu();
    return;
  }
  apriMenu(pillola, disegnaScelte(nome, attuali), scegliFiltro);
});

/** Tocco su una scelta del menu: la lista si aggiorna e il menu si chiude. */
function scegliFiltro(bersaglio: Element): void {
  const scelta = bersaglio.closest<HTMLElement>('[data-filtro]');
  const cambio = cambioDa(scelta?.dataset['filtro'], scelta?.dataset['valore']);
  if (!cambio) return;
  chiudiMenu();
  preferenze =
    cambio.filtro === 'carburante'
      ? cambiaCarburante(preferenze, cambio.valore) // self/servito torna quello adatto al nuovo carburante
      : { ...preferenze, [cambio.filtro]: cambio.valore };
  salvaPreferenze(preferenze);
  disegnaBarraFiltri();
  mostraRisultati(true);
  // il fuoco torna sulla pillola (è un bottone: non riapre nulla), utile con tastiera e VoiceOver
  zonaFiltri.querySelector<HTMLElement>(`[data-apri-filtro="${cambio.filtro}"]`)?.focus({ preventScroll: true });
}

// ——— Slider del raggio ———
function cambiaRaggio(raggioKm: RaggioKm | undefined): void {
  if (!raggioKm || raggioKm === filtri()?.raggioKm) return;
  preferenze = { ...preferenze, raggioKm };
  salvaPreferenze(preferenze);
  // si aggiornano solo testi e tacche: lo slider resta lo stesso, così il dito non lo perde
  const slider = zonaRaggio.querySelector<HTMLInputElement>('[data-slider-raggio]');
  slider?.setAttribute('aria-valuetext', `${String(raggioKm)} km`);
  for (const tacca of zonaRaggio.querySelectorAll<HTMLElement>('[data-raggio-km]')) {
    tacca.toggleAttribute('data-scelta', tacca.dataset['raggioKm'] === String(raggioKm));
  }
  mostraRisultati(true);
  daInquadrare = true; // il cerchio nuovo, intorno allo stesso centro
  void aggiornaMappa();
}

zonaRaggio.addEventListener('input', (evento) => {
  cambiaRaggio(raggioDaPosizione((evento.target as HTMLInputElement).value));
});
zonaRaggio.addEventListener('click', (evento) => {
  const tacca = (evento.target as Element).closest<HTMLElement>('[data-raggio-km]');
  const raggioKm = raggioDaTesto(tacca?.dataset['raggioKm']);
  if (!tacca || !raggioKm) return;
  const slider = zonaRaggio.querySelector<HTMLInputElement>('[data-slider-raggio]');
  if (slider) slider.value = String(RAGGI_KM.indexOf(raggioKm));
  cambiaRaggio(raggioKm);
});

disegnaIcone();
preparaMenu();
disegnaBarraFiltri();
coloreBarraDiStato();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', coloreBarraDiStato);
if (!preferenze.carburante) mostraPartenza();
void avvia();
