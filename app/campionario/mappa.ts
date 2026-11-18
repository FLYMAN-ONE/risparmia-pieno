// Mappa del campionario (passo 10): OpenFreeMap con le etichette dei prezzi e i raggruppamenti.
// Si carica solo quando l'utente tocca "Mappa".
import {
  Map as MappaLibre,
  Marker,
  NavigationControl,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type MapSourceDataEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CENTRO, PUNTI } from './dati-mappa.ts';

const STILI = {
  chiaro: 'https://tiles.openfreemap.org/styles/positron',
  scuro: 'https://tiles.openfreemap.org/styles/dark',
};

const coordinate = (f: MapGeoJSONFeature) => (f.geometry as unknown as { coordinates: [number, number] }).coordinates;
const euro = (n: number) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 3 }).format(n);
const media = PUNTI.reduce((s, p) => s + p[2], 0) / PUNTI.length;
function fascia(v: number): string {
  const d = v - media;
  return d <= -0.01 ? 'conveniente' : d >= 0.01 ? 'caro' : 'media';
}

export function creaMappa(contenitore: HTMLElement, scuro: () => boolean): void {
  const div = document.createElement('div');
  div.className = 'mappa-vera';
  contenitore.append(div);

  const mappa = new MappaLibre({
    container: div,
    style: scuro() ? STILI.scuro : STILI.chiaro,
    center: [CENTRO[0], CENTRO[1]],
    zoom: 12,
    attributionControl: { compact: true },
    // Nessuna richiesta deve portare con sé l'indirizzo della pagina
    transformRequest: (url: string) => ({ url, referrerPolicy: 'no-referrer' }),
  });
  mappa.addControl(new NavigationControl({ showCompass: false }), 'top-right');

  const tu = document.createElement('div');
  tu.className = 'tu-mappa';
  tu.setAttribute('aria-label', 'La tua posizione (simulata)');
  new Marker({ element: tu }).setLngLat([CENTRO[0], CENTRO[1]]).addTo(mappa);

  const aggiungiDati = () => {
    if (mappa.getSource('prezzi')) return;
    mappa.addSource('prezzi', {
      type: 'geojson',
      cluster: true,
      clusterRadius: 72,
      clusterMaxZoom: 14,
      clusterProperties: { minimo: ['min', ['get', 'euro']] },
      data: {
        type: 'FeatureCollection',
        features: PUNTI.map(([lon, lat, prezzo, marchio], i) => ({
          type: 'Feature',
          id: i,
          properties: { euro: prezzo, marchio },
          geometry: { type: 'Point', coordinates: [lon, lat] },
        })),
      },
    });
    // Livello invisibile: serve solo a far calcolare i raggruppamenti; le etichette sono HTML
    mappa.addLayer({ id: 'prezzi-punti', type: 'circle', source: 'prezzi', paint: { 'circle-radius': 0, 'circle-opacity': 0 } });
  };

  // Etichette HTML (prezzo o "12 · da 2,180"), ricalcolate quando la mappa si ferma
  const etichette = new Map<string, Marker>();
  const aggiornaEtichette = () => {
    if (!mappa.getSource('prezzi')) return;
    const visti = new Set<string>();
    for (const f of mappa.querySourceFeatures('prezzi') as MapGeoJSONFeature[]) {
      const p = f.properties as Record<string, number | string | boolean>;
      const gruppo = p['cluster'] === true;
      const chiave = gruppo ? `g${String(p['cluster_id'])}` : `p${String(f.id)}`;
      if (visti.has(chiave)) continue;
      visti.add(chiave);
      if (etichette.has(chiave)) continue;
      const el = document.createElement('button');
      if (gruppo) {
        el.className = 'etichetta-prezzo gruppo';
        el.innerHTML = `${String(p['point_count'])} · da <b class="${fascia(Number(p['minimo']))}">${euro(Number(p['minimo']))}</b>`;
        el.addEventListener('click', async () => {
          const zoom = await (mappa.getSource('prezzi') as GeoJSONSource).getClusterExpansionZoom(Number(p['cluster_id']));
          mappa.easeTo({ center: coordinate(f), zoom });
        });
      } else {
        el.className = `etichetta-prezzo ${fascia(Number(p['euro']))}`;
        el.textContent = euro(Number(p['euro']));
        el.setAttribute('aria-label', `${String(p['marchio'])}, ${euro(Number(p['euro']))} euro al litro`);
      }
      const m = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat(coordinate(f))
        .addTo(mappa);
      etichette.set(chiave, m);
    }
    for (const [chiave, m] of etichette) {
      if (!visti.has(chiave)) {
        m.remove();
        etichette.delete(chiave);
      }
    }
  };

  mappa.on('load', () => {
    aggiungiDati();
    aggiornaEtichette();
  });
  mappa.on('moveend', aggiornaEtichette);
  mappa.on('sourcedata', (e: MapSourceDataEvent) => {
    if (e.sourceId === 'prezzi' && e.isSourceLoaded) aggiornaEtichette();
  });

  // Il tema della mappa segue quello dell'app
  window.addEventListener('tema-cambiato', () => {
    mappa.setStyle(scuro() ? STILI.scuro : STILI.chiaro);
    mappa.once('style.load', () => {
      aggiungiDati();
      aggiornaEtichette();
    });
  });
}
