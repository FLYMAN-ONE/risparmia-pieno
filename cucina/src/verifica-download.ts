// Verifica a mano che i due file MIMIT si scarichino.
// Uso: node cucina/src/verifica-download.ts
import { scaricaTesto, URL_ANAGRAFICA, URL_PREZZI } from './scarica.ts';

for (const url of [URL_ANAGRAFICA, URL_PREZZI]) {
  const inizio = Date.now();
  const testo = await scaricaTesto(url);
  const righe = testo.split('\n');
  console.log(`\n${url}`);
  console.log(`  ${(testo.length / 1_000_000).toFixed(1)} MB, ${righe.length} righe, ${Date.now() - inizio} ms`);
  console.log(`  riga 1: ${righe[0]}`);
  console.log(`  riga 2: ${righe[1]}`);
}
