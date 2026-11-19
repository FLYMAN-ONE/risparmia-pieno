// La mappa (fase 5). Questo modulo e MapLibre si scaricano solo quando l'utente tocca "Mappa":
// la vista Lista non contatta nessun dominio esterno (regola privacy 8).
// La posizione serve solo a centrare la mappa e a disegnare il punto blu: resta in memoria.
import { Map as MappaLibre, Marker, NavigationControl, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Il "worker" di MapLibre (disegna le tessere in parallelo) è un file a parte che Vite non vede da solo:
// senza questa riga nel sito pubblicato la mappa resta vuota. È incluso nell'app, non scaricato da fuori.
import indirizzoWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { confiniRaggio, richiestaSicura, STILI, type Centro } from './stile.ts';
import { scegliEtichette } from './etichette.ts';
import type { Voce } from '../lista/lista.ts';
import { formattaCifre, type Unita } from '../lista/prezzo.ts';
import { nomeDi } from '../lista/vista.ts';

export interface Mappa {
  /** Inquadra il cerchio del raggio intorno al centro e sposta il punto blu.
      vola: con il movimento di MapLibre (passo 9), che con "Riduci movimento" diventa istantaneo da solo. */
  inquadra(centro: Centro, raggioKm: number, vola?: boolean): void;
  /** I distributori della lista (già filtrati, colorati per fascia e in ordine di prezzo) */
  mostraPrezzi(voci: readonly Voce[], unita: Unita): void;
}

/** Un colore del file dei token, letto al momento (cambia con il tema). */
function token(nome: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${nome}`).trim();
}

const SORGENTE = 'prezzi';
const LIVELLO = 'prezzi-pallini';

/** Tema scuro se l'app è in tema scuro (automatico o scelto). */
function scuro(): boolean {
  const tema = document.documentElement.dataset['tema'];
  return tema === 'scuro' || (tema !== 'chiaro' && matchMedia('(prefers-color-scheme: dark)').matches);
}

const MARGINE_PX = 24;

setWorkerUrl(indirizzoWorker);

export function creaMappa(contenitore: HTMLElement, centro: Centro, raggioKm: number): Mappa {
  const mappa = new MappaLibre({
    container: contenitore,
    style: scuro() ? STILI.scuro : STILI.chiaro,
    bounds: confiniRaggio(centro, raggioKm),
    fitBoundsOptions: { padding: MARGINE_PX },
    attributionControl: { compact: true },
    transformRequest: richiestaSicura,
    // Mappa piatta e sempre con il nord in alto: più semplice da leggere con una mano
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    maxPitch: 0,
  });
  mappa.touchZoomRotate.disableRotation();
  mappa.addControl(new NavigationControl({ showCompass: false }), 'top-right');

  // Il punto blu: solo sullo schermo
  const punto = document.createElement('div');
  punto.className = 'tu-sei-qui';
  punto.setAttribute('role', 'img');
  punto.setAttribute('aria-label', 'La tua posizione');
  const tu = new Marker({ element: punto }).setLngLat([centro.lon, centro.lat]).addTo(mappa);

  // La scritta "Carico la mappa…" resta finché non arriva il primo pezzo di cartina
  // (l'evento "load" di MapLibre aspetta tutte le tessere e con i prezzi sopra può tardare molto)
  const togliCaricamento = (evento: { sourceId?: string; tile?: unknown }) => {
    if (evento.sourceId === SORGENTE || !evento.tile) return;
    contenitore.querySelector('.caricamento')?.remove();
    mappa.off('sourcedata', togliCaricamento);
  };
  mappa.on('sourcedata', togliCaricamento);

  // ——— Prezzi ———
  let voci: readonly Voce[] = [];
  let unita: Unita = 'l';
  const etichette: Marker[] = [];

  const datiPallini = () => ({
    type: 'FeatureCollection' as const,
    features: voci.map((v, i) => ({
      type: 'Feature' as const,
      properties: { i, fascia: v.fascia, vecchio: v.vecchio },
      geometry: { type: 'Point' as const, coordinates: [v.distributore.lon, v.distributore.lat] },
    })),
  });

  /** I pallini li disegna MapLibre: restano veloci anche con centinaia di distributori.
      Da rifare a ogni cambio di stile (tema), con i colori del tema nuovo. */
  function aggiungiPallini(): void {
    if (mappa.getSource(SORGENTE)) return;
    mappa.addSource(SORGENTE, { type: 'geojson', data: datiPallini() });
    mappa.addLayer({
      id: LIVELLO,
      type: 'circle',
      source: SORGENTE,
      paint: {
        'circle-radius': 6,
        'circle-color': ['match', ['get', 'fascia'], 'conveniente', token('conveniente'), 'caro', token('caro'), token('media')],
        'circle-stroke-width': 2,
        'circle-stroke-color': token('superficie'),
        'circle-opacity': ['case', ['get', 'vecchio'], Number(token('opacita-vecchio')) || 1, 1],
        'circle-stroke-opacity': ['case', ['get', 'vecchio'], Number(token('opacita-vecchio')) || 1, 1],
      },
    });
    aggiornaEtichette();
  }
  mappa.on('style.load', aggiungiPallini);

  /** Larghezza e altezza di un'etichetta, misurate davvero (il testo cresce con le impostazioni del telefono). */
  function misuraEtichetta(): { larghezza: number; altezza: number } {
    const prova = creaEtichetta(voci[0]!);
    prova.style.visibility = 'hidden';
    prova.style.position = 'absolute';
    contenitore.append(prova);
    const { width, height } = prova.getBoundingClientRect();
    prova.remove();
    return { larghezza: width, altezza: height };
  }

  function creaEtichetta(voce: Voce): HTMLElement {
    const el = document.createElement('span');
    el.className = `etichetta-prezzo fascia-${voce.fascia}${voce.vecchio ? ' e-vecchio' : ''}`;
    el.textContent = formattaCifre(voce.euro);
    el.setAttribute('role', 'img');
    el.setAttribute(
      'aria-label',
      `${nomeDi(voce)}, ${formattaCifre(voce.euro)} euro al ${unita === 'kg' ? 'chilo' : 'litro'}${voce.vecchio ? ', prezzo vecchio' : ''}`,
    );
    return el;
  }

  /** Dal prezzo più basso, etichetta a chi ha spazio; agli altri resta il pallino. Si rifà a ogni spostamento. */
  function aggiornaEtichette(): void {
    for (const m of etichette.splice(0)) m.remove();
    if (!mappa.getLayer(LIVELLO)) return;
    const limiti = mappa.getBounds();
    const visibili = voci
      .map((voce, i) => ({ voce, i, ...mappa.project([voce.distributore.lon, voce.distributore.lat]) }))
      .filter(({ voce }) => limiti.contains([voce.distributore.lon, voce.distributore.lat]));
    const scelti = visibili.length ? scegliEtichette(
      visibili.map((v) => ({ ...v, vecchio: v.voce.vecchio })),
      { ...misuraEtichetta(), distacco: 4 },
    ) : new Set<{ i: number; voce: Voce }>();
    for (const { voce } of scelti) {
      etichette.push(
        new Marker({ element: creaEtichetta(voce), anchor: 'bottom' }).setLngLat([voce.distributore.lon, voce.distributore.lat]).addTo(mappa),
      );
    }
    // Sotto un'etichetta il pallino non serve
    mappa.setFilter(LIVELLO, ['!', ['in', ['get', 'i'], ['literal', [...scelti].map((s) => s.i)]]]);
  }
  mappa.on('moveend', aggiornaEtichette);

  // Toccando un pallino la mappa si avvicina, così compaiono le etichette
  mappa.on('click', LIVELLO, (evento) => {
    mappa.easeTo({ center: evento.lngLat, zoom: mappa.getZoom() + 1.5 });
  });
  mappa.on('mouseenter', LIVELLO, () => (mappa.getCanvas().style.cursor = 'pointer'));
  mappa.on('mouseleave', LIVELLO, () => (mappa.getCanvas().style.cursor = ''));

  // Il tema della mappa segue quello del telefono; i pallini si ricreano con i colori del nuovo tema
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    mappa.setStyle(scuro() ? STILI.scuro : STILI.chiaro, { diff: false });
  });

  return {
    inquadra(nuovo, km, vola = false) {
      tu.setLngLat([nuovo.lon, nuovo.lat]);
      mappa.resize(); // il contenitore può essere stato nascosto
      mappa.fitBounds(confiniRaggio(nuovo, km), { padding: MARGINE_PX, ...(vola ? {} : { duration: 0 }) });
    },
    mostraPrezzi(nuove, nuovaUnita) {
      voci = nuove;
      unita = nuovaUnita;
      (mappa.getSource(SORGENTE) as GeoJSONSource | undefined)?.setData(datiPallini());
      aggiornaEtichette();
    },
  };
}
