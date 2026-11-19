// Come si scrive la data dei prezzi nell'interfaccia (passo 11 di ux-design.md).
// Dal 19/11/2026 la data non è più sempre visibile: compare solo l'avviso quando i prezzi sono in ritardo.

/** "2026-11-19" → "19/11" */
export function giornoBreve(data: string): string {
  const [, mese, giorno] = data.split('-');
  return `${giorno}/${mese}`;
}

/** Mezzogiorno (ora del telefono) del giorno indicato, spostato di `piuGiorni` */
function mezzogiorno(data: string, piuGiorni: number): Date {
  const [anno, mese, giorno] = data.split('-').map(Number);
  return new Date(anno ?? 0, (mese ?? 1) - 1, (giorno ?? 1) + piuGiorni, 12);
}

/**
 * I prezzi del giorno X arrivano la mattina del giorno X+1. Se a mezzogiorno del giorno X+2
 * non è arrivato il file nuovo, i prezzi sono in ritardo: restituisce l'avviso da mostrare.
 */
export function avvisoRitardo(dataEstrazione: string, adesso: Date): string | undefined {
  if (adesso < mezzogiorno(dataEstrazione, 2)) return undefined;
  const oggi = new Date(adesso.getFullYear(), adesso.getMonth(), adesso.getDate(), 12);
  const giorni = Math.round((oggi.getTime() - mezzogiorno(dataEstrazione, 0).getTime()) / 86_400_000);
  return `Prezzi di ${String(giorni)} giorni fa (${giornoBreve(dataEstrazione)}). L'aggiornamento di oggi non è ancora arrivato.`;
}
