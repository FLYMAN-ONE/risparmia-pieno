// Come si scrive la data dei prezzi nell'interfaccia (passo 11 di ux-design.md).

/** "2026-11-19" → "19/11" */
export function giornoBreve(data: string): string {
  const [, mese, giorno] = data.split('-');
  return `${giorno}/${mese}`;
}

/** I prezzi MIMIT sono quelli in vigore alle 8 del mattino: "Prezzi del 19/11, ore 8" */
export function testoDataPrezzi(dataEstrazione: string): string {
  return `Prezzi del ${giornoBreve(dataEstrazione)}, ore 8`;
}
