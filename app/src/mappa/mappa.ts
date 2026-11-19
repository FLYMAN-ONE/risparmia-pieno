// La mappa (fase 5). Questo modulo e MapLibre si scaricano solo quando l'utente tocca "Mappa":
// la vista Lista non contatta nessun dominio esterno (regola privacy 8).
// La posizione serve solo a centrare la mappa e a disegnare il punto blu: resta in memoria.
import { Map as MappaLibre, Marker, NavigationControl, setWorkerUrl, type FilterSpecification, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Il "worker" di MapLibre (disegna le tessere in parallelo) è un file a parte che Vite non vede da solo:
// senza questa riga nel sito pubblicato la mappa resta vuota. È incluso nell'app, non scaricato da fuori.
import indirizzoWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { confiniRaggio, richiestaSicura, STILI, type Centro } from './stile.ts';
import { cerchioCoperto, riquadroDi, scegliEtichette, type Riquadro } from './etichette.ts';
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
const LIVELLO_GRUPPI = 'prezzi-gruppi';
const LIVELLO_NUMERI = 'prezzi-gruppi-numeri';
/** Raggio dei gruppi in pixel: fino a 9, da 10, da 50 distributori */
const RAGGI_GRUPPO = [13, 16, 20] as const;
const raggioGruppo = (conta: number) => (conta >= 50 ? RAGGI_GRUPPO[2] : conta >= 10 ? RAGGI_GRUPPO[1] : RAGGI_GRUPPO[0]);
/** Spazio minimo tra due etichette col prezzo */
const DISTACCO_PX = 12;
/** Al massimo tanti prezzi per schermata: i più economici; gli altri distributori vanno nei gruppi */
const MASSIMO_ETICHETTE = 15;

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
  // Etichette col prezzo ai più economici finché c'è spazio; tutti gli altri distributori
  // li raggruppa MapLibre in cerchietti grigi con il numero (decisione del 19/11/2026).
  let voci: readonly Voce[] = [];
  let unita: Unita = 'l';
  const etichette: Marker[] = [];
  /** Le voci (per posizione nella lista) che hanno già l'etichetta: non vanno nei gruppi */
  let conEtichetta = new Set<number>();

  const datiPallini = () => ({
    type: 'FeatureCollection' as const,
    features: voci.flatMap((v, i) =>
      conEtichetta.has(i)
        ? []
        : [
            {
              type: 'Feature' as const,
              properties: { fascia: v.fascia, vecchio: v.vecchio },
              geometry: { type: 'Point' as const, coordinates: [v.distributore.lon, v.distributore.lat] },
            },
          ],
    ),
  });

  /** Gruppi e pallini li disegna MapLibre: restano veloci anche con centinaia di distributori.
      Da rifare a ogni cambio di stile (tema), con i colori del tema nuovo. */
  function aggiungiPallini(): void {
    if (mappa.getSource(SORGENTE)) return;
    mappa.addSource(SORGENTE, {
      type: 'geojson',
      data: datiPallini(),
      cluster: true,
      clusterRadius: 60, // pixel: i distributori più vicini di così si uniscono
      clusterMaxZoom: 14, // da vicino ogni distributore torna singolo
    });
    // Il gruppo: cerchietto grigio, più grande se contiene più distributori
    mappa.addLayer({
      id: LIVELLO_GRUPPI,
      type: 'circle',
      source: SORGENTE,
      filter: ['has', 'point_count'],
      paint: {
        'circle-radius': ['step', ['get', 'point_count'], RAGGI_GRUPPO[0], 10, RAGGI_GRUPPO[1], 50, RAGGI_GRUPPO[2]],
        'circle-color': token('superficie'),
        'circle-stroke-width': 1.5,
        'circle-stroke-color': token('testo-2'),
      },
    });
    mappa.addLayer({
      id: LIVELLO_NUMERI,
      type: 'symbol',
      source: SORGENTE,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['Noto Sans Regular'], // già usato dalla mappa: nessun carattere in più da scaricare
        'text-size': 13,
        'text-allow-overlap': true,
      },
      paint: { 'text-color': token('testo') },
    });
    // Il distributore da solo: pallino colorato per fascia
    mappa.addLayer({
      id: LIVELLO,
      type: 'circle',
      source: SORGENTE,
      filter: ['!', ['has', 'point_count']],
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

  /** Dal prezzo più basso, etichetta a chi ha spazio; gli altri vanno nei gruppi. Si rifà a ogni spostamento. */
  function aggiornaEtichette(): void {
    for (const m of etichette.splice(0)) m.remove();
    const sorgente = mappa.getSource(SORGENTE) as GeoJSONSource | undefined;
    if (!sorgente) return;
    const limiti = mappa.getBounds();
    const visibili = voci
      .map((voce, i) => ({ voce, i, vecchio: voce.vecchio, ...mappa.project([voce.distributore.lon, voce.distributore.lat]) }))
      .filter(({ voce }) => limiti.contains([voce.distributore.lon, voce.distributore.lat]));
    const misura = visibili.length ? misuraEtichetta() : { larghezza: 0, altezza: 0 };
    // un po' d'aria tra le etichette: la mappa resta leggibile
    const scelti = visibili.length ? scegliEtichette(visibili, { ...misura, distacco: DISTACCO_PX, massimo: MASSIMO_ETICHETTE }) : new Set<(typeof visibili)[number]>();
    riquadri = [...scelti].map((s) => riquadroDi(s, misura));
    for (const { voce } of scelti) {
      etichette.push(
        new Marker({ element: creaEtichetta(voce), anchor: 'bottom' }).setLngLat([voce.distributore.lon, voce.distributore.lat]).addTo(mappa),
      );
    }
    conEtichetta = new Set([...scelti].map((s) => s.i));
    void sorgente.setData(datiPallini());
  }
  mappa.on('moveend', aggiornaEtichette);

  /** I gruppi che cadrebbero sotto un'etichetta non si disegnano: lì il prezzo più basso c'è già. */
  let riquadri: Riquadro[] = [];
  function nascondiGruppiCoperti(): void {
    if (!mappa.getLayer(LIVELLO_GRUPPI)) return;
    const coperti = mappa
      .querySourceFeatures(SORGENTE, { filter: ['has', 'point_count'] })
      .filter((g) => {
        const [lon, lat] = (g.geometry as { coordinates: [number, number] }).coordinates;
        const conta = Number(g.properties['point_count']);
        return cerchioCoperto(mappa.project([lon, lat]), raggioGruppo(conta), riquadri);
      })
      .map((g) => Number(g.properties['cluster_id']));
    const filtro: FilterSpecification = ['all', ['has', 'point_count'], ['!', ['in', ['get', 'cluster_id'], ['literal', coperti]]]];
    mappa.setFilter(LIVELLO_GRUPPI, filtro);
    mappa.setFilter(LIVELLO_NUMERI, filtro);
  }
  mappa.on('sourcedata', (evento) => {
    if (evento.sourceId === SORGENTE && evento.isSourceLoaded) nascondiGruppiCoperti();
  });

  // Toccando un gruppo la mappa si avvicina quanto basta per dividerlo
  mappa.on('click', LIVELLO_GRUPPI, async (evento) => {
    const gruppo = evento.features?.[0];
    const id = gruppo?.properties['cluster_id'] as number | undefined;
    if (id === undefined) return;
    const zoom = await (mappa.getSource(SORGENTE) as GeoJSONSource).getClusterExpansionZoom(id);
    mappa.easeTo({ center: evento.lngLat, zoom });
  });
  // Toccando un pallino la mappa si avvicina, così compare la sua etichetta
  mappa.on('click', LIVELLO, (evento) => {
    mappa.easeTo({ center: evento.lngLat, zoom: mappa.getZoom() + 1.5 });
  });
  for (const livello of [LIVELLO, LIVELLO_GRUPPI]) {
    mappa.on('mouseenter', livello, () => (mappa.getCanvas().style.cursor = 'pointer'));
    mappa.on('mouseleave', livello, () => (mappa.getCanvas().style.cursor = ''));
  }

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
      aggiornaEtichette(); // ricalcola etichette e gruppi
    },
  };
}
