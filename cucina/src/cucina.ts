// La cucina dei dati: legge i due file MIMIT, li controlla e scrive il file nazionale.
// Uso: node cucina/src/cucina.ts <cartella con i due CSV> <file da scrivere>
// Se un controllo di qualità fallisce, non scrive nulla ed esce con errore.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generaFile } from './genera.ts';
import { leggiAnagrafica, leggiPrezzi } from './leggi.ts';
import { controllaQualita } from './qualita.ts';
import { unisci } from './unisci.ts';

const [cartella, destinazione] = process.argv.slice(2);
if (!cartella || !destinazione) {
  console.error('Uso: node cucina/src/cucina.ts <cartella con i due CSV> <file da scrivere>');
  process.exit(2);
}

const anagrafica = leggiAnagrafica(readFileSync(join(cartella, 'anagrafica_impianti_attivi.csv'), 'utf8'));
const prezzi = leggiPrezzi(readFileSync(join(cartella, 'prezzo_alle_8.csv'), 'utf8'));
const controllo = controllaQualita(anagrafica, prezzi, unisci(anagrafica, prezzi));

console.log(`Dati del ${anagrafica.dataEstrazione}`);
console.log(JSON.stringify(controllo.resoconto, null, 2));
const sconosciuti = Object.keys(controllo.resoconto.carburantiSconosciuti);
if (sconosciuti.length > 0) {
  console.log(`ATTENZIONE: carburanti sconosciuti, finiti in "altro": ${sconosciuti.join(', ')}`);
}

if (controllo.problemi.length > 0) {
  console.error('\nNON PUBBLICO: i dati non superano i controlli di qualità.');
  for (const problema of controllo.problemi) console.error(`- ${problema}`);
  process.exit(1);
}

const file = generaFile(controllo.distributori, anagrafica.dataEstrazione, new Date());
writeFileSync(destinazione, JSON.stringify(file));
console.log(`\nScritto ${destinazione}: ${file.distributori.length} distributori, ${file.comuni.length} comuni.`);
