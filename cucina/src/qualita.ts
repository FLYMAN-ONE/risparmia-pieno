// Controlli di qualità sui dati del giorno (decisioni del 18/11/2026).
// Due livelli: si scarta il singolo dato sbagliato, oppure si ferma tutto
// e resta pubblicato il file del giorno prima.
import type { Letto } from './leggi.ts';
import type { Distributore, PrezzoClassificato, Unione } from './unisci.ts';

export const REGOLE = {
  /** un prezzo sotto il 60% del prezzo tipico del suo carburante si scarta */
  minimoRispettoAlTipico: 0.6,
  /** un prezzo sopra il 150% del prezzo tipico del suo carburante si scarta */
  massimoRispettoAlTipico: 1.5,
  /** con meno prezzi di così, il prezzo tipico di un premium non è affidabile: si usa quello del carburante normale */
  minimoPrezziPerTipico: 20,
  /** oltre questi giorni il prezzo è segnato come vecchio */
  giorniPrezzoVecchio: 7,
  /** oltre questi giorni il prezzo si scarta */
  giorniPrezzoScartato: 30,
  /** confini approssimativi dell'Italia */
  italia: { latMin: 35.4, latMax: 47.1, lonMin: 6.6, lonMax: 18.6 },
  // Soglie che fermano la pubblicazione
  massimoRigheIllegibili: 0.01,
  minimoDistributori: 18_000,
  minimoPrezzi: 70_000,
  massimoPrezziAssurdi: 0.02,
  massimoCoordinateFuori: 0.02,
};

export type Regole = typeof REGOLE;

export interface PrezzoControllato extends PrezzoClassificato {
  /** comunicato dal gestore da più di 7 giorni */
  vecchio: boolean;
}

export interface DistributoreControllato extends Omit<Distributore, 'prezzi' | 'lat' | 'lon'> {
  lat: number;
  lon: number;
  prezzi: PrezzoControllato[];
}

export interface Resoconto {
  distributori: number;
  prezzi: number;
  righeIllegibili: number;
  coordinateFuori: number;
  prezziAssurdi: number;
  prezziScartatiPerEta: number;
  prezziVecchi: number;
  /** prezzo tipico (mediana) di ogni carburante, per esempio "gasolio": 2.2, "gasolio premium": 2.399 */
  prezziTipici: Record<string, number>;
  carburantiSconosciuti: Record<string, number>;
}

export interface Controllo {
  distributori: DistributoreControllato[];
  resoconto: Resoconto;
  /** motivi per cui NON si deve pubblicare; vuoto se va tutto bene */
  problemi: string[];
}

const GIORNO_MS = 86_400_000;

/** Mediana: il valore che sta a metà, dopo averli ordinati. */
export function mediana(valori: number[]): number {
  const ordinati = [...valori].sort((a, b) => a - b);
  const meta = Math.floor(ordinati.length / 2);
  if (ordinati.length === 0) return Number.NaN;
  return ordinati.length % 2 === 1
    ? (ordinati[meta] as number)
    : ((ordinati[meta - 1] as number) + (ordinati[meta] as number)) / 2;
}

/** Nome del gruppo di confronto di un prezzo: i premium hanno un prezzo tipico a parte. */
function gruppo(prezzo: PrezzoClassificato): string {
  return prezzo.premium ? `${prezzo.categoria} premium` : prezzo.categoria;
}

/** Giorni passati tra la comunicazione del gestore e le 8 del giorno di estrazione. */
export function giorniTrascorsi(comunicato: string, dataEstrazione: string): number {
  const riferimento = Date.parse(`${dataEstrazione}T08:00:00Z`);
  return (riferimento - Date.parse(`${comunicato}Z`)) / GIORNO_MS;
}

function percentuale(parte: number, totale: number): string {
  return `${((parte / totale) * 100).toFixed(1).replace('.', ',')}%`;
}

export function controllaQualita(
  anagrafica: Letto<unknown>,
  prezzi: Letto<unknown>,
  unione: Unione,
  regole: Regole = REGOLE,
): Controllo {
  const problemi: string[] = [];

  // 1. Righe che non si sono potute leggere
  const righeTotali =
    anagrafica.righe.length + anagrafica.scartate.length + prezzi.righe.length + prezzi.scartate.length;
  const righeIllegibili = anagrafica.scartate.length + prezzi.scartate.length;
  if (righeIllegibili > righeTotali * regole.massimoRigheIllegibili) {
    problemi.push(`Troppe righe illeggibili: ${righeIllegibili} (${percentuale(righeIllegibili, righeTotali)})`);
  }

  // 2. Coordinate mancanti o fuori dall'Italia
  const { italia } = regole;
  const inItalia = (d: Distributore): d is Distributore & { lat: number; lon: number } =>
    d.lat !== null &&
    d.lon !== null &&
    d.lat >= italia.latMin &&
    d.lat <= italia.latMax &&
    d.lon >= italia.lonMin &&
    d.lon <= italia.lonMax;
  const conCoordinate = unione.distributori.filter(inItalia);
  const coordinateFuori = unione.distributori.length - conCoordinate.length;
  if (coordinateFuori > unione.distributori.length * regole.massimoCoordinateFuori) {
    problemi.push(
      `Troppi distributori senza coordinate valide: ${coordinateFuori} (${percentuale(coordinateFuori, unione.distributori.length)})`,
    );
  }

  // 3. Prezzo tipico di ogni carburante, calcolato su tutti i prezzi del giorno
  const perGruppo = new Map<string, number[]>();
  for (const d of conCoordinate) {
    for (const p of d.prezzi) {
      const lista = perGruppo.get(gruppo(p));
      if (lista) lista.push(p.euro);
      else perGruppo.set(gruppo(p), [p.euro]);
    }
  }
  const prezziTipici: Record<string, number> = {};
  for (const [nome, valori] of perGruppo) prezziTipici[nome] = mediana(valori);
  const tipicoPer = (p: PrezzoClassificato): number => {
    const proprio = perGruppo.get(gruppo(p)) ?? [];
    const normale = prezziTipici[p.categoria];
    if (proprio.length < regole.minimoPrezziPerTipico && normale !== undefined) return normale;
    return prezziTipici[gruppo(p)] as number;
  };

  // 4. Si scartano i prezzi assurdi e quelli troppo vecchi, si segnano quelli vecchi
  let prezziIniziali = 0;
  let prezziAssurdi = 0;
  let prezziScartatiPerEta = 0;
  let prezziVecchi = 0;
  const distributori: DistributoreControllato[] = [];
  for (const d of conCoordinate) {
    const tenuti: PrezzoControllato[] = [];
    for (const p of d.prezzi) {
      prezziIniziali++;
      const tipico = tipicoPer(p);
      if (
        p.euro <= 0 ||
        p.euro < tipico * regole.minimoRispettoAlTipico ||
        p.euro > tipico * regole.massimoRispettoAlTipico
      ) {
        prezziAssurdi++;
        continue;
      }
      const giorni = giorniTrascorsi(p.comunicato, unione.dataEstrazione);
      if (giorni > regole.giorniPrezzoScartato) {
        prezziScartatiPerEta++;
        continue;
      }
      const vecchio = giorni > regole.giorniPrezzoVecchio;
      if (vecchio) prezziVecchi++;
      tenuti.push({ ...p, vecchio });
    }
    if (tenuti.length > 0) distributori.push({ ...d, prezzi: tenuti });
  }

  if (prezziAssurdi > prezziIniziali * regole.massimoPrezziAssurdi) {
    problemi.push(`Troppi prezzi fuori soglia: ${prezziAssurdi} (${percentuale(prezziAssurdi, prezziIniziali)})`);
  }

  // 5. Quantità minime di quello che si pubblicherebbe
  const prezziFinali = distributori.reduce((somma, d) => somma + d.prezzi.length, 0);
  if (distributori.length < regole.minimoDistributori) {
    problemi.push(`Troppo pochi distributori: ${distributori.length} (minimo ${regole.minimoDistributori})`);
  }
  if (prezziFinali < regole.minimoPrezzi) {
    problemi.push(`Troppo pochi prezzi: ${prezziFinali} (minimo ${regole.minimoPrezzi})`);
  }

  return {
    distributori,
    resoconto: {
      distributori: distributori.length,
      prezzi: prezziFinali,
      righeIllegibili,
      coordinateFuori,
      prezziAssurdi,
      prezziScartatiPerEta,
      prezziVecchi,
      prezziTipici,
      carburantiSconosciuti: unione.carburantiSconosciuti,
    },
    problemi,
  };
}
