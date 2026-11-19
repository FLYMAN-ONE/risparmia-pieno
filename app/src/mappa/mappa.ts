// La mappa (fase 5). Questo modulo e MapLibre si scaricano solo quando l'utente tocca "Mappa":
// la vista Lista non contatta nessun dominio esterno (regola privacy 8).
// La posizione serve solo a centrare la mappa e a disegnare il punto blu: resta in memoria.
import { Map as MappaLibre, Marker, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { confiniRaggio, richiestaSicura, STILI, type Centro } from './stile.ts';

export interface Mappa {
  /** Inquadra il cerchio del raggio intorno al centro e sposta il punto blu.
      vola: con il movimento di MapLibre (passo 9), che con "Riduci movimento" diventa istantaneo da solo. */
  inquadra(centro: Centro, raggioKm: number, vola?: boolean): void;
}

/** Tema scuro se l'app è in tema scuro (automatico o scelto). */
function scuro(): boolean {
  const tema = document.documentElement.dataset['tema'];
  return tema === 'scuro' || (tema !== 'chiaro' && matchMedia('(prefers-color-scheme: dark)').matches);
}

const MARGINE_PX = 24;

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

  // Il tema della mappa segue quello del telefono
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    mappa.setStyle(scuro() ? STILI.scuro : STILI.chiaro);
  });

  return {
    inquadra(nuovo, km, vola = false) {
      tu.setLngLat([nuovo.lon, nuovo.lat]);
      mappa.resize(); // il contenitore può essere stato nascosto
      mappa.fitBounds(confiniRaggio(nuovo, km), { padding: MARGINE_PX, ...(vola ? {} : { duration: 0 }) });
    },
  };
}
