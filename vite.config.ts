import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';
import { fileDaPrecaricare } from './app/src/offline/regole.ts';

/**
 * Il custode dell'app (service worker) deve sapere quali file conservare e con quale impronta.
 * Questo pezzo, alla fine della costruzione, scrive in sw.js l'elenco dei file e un'impronta
 * che cambia solo se cambia l'app: così il telefono scarica la versione nuova solo quando serve.
 */
function custodeConElencoFile(): Plugin {
  return {
    name: 'custode-con-elenco-file',
    apply: 'build',
    // A file già scritti: solo ora l'elenco comprende anche index.html
    writeBundle(opzioni, pacchetto) {
      const percorso = join(opzioni.dir ?? 'dist', 'sw.js');
      const elenco = fileDaPrecaricare(Object.keys(pacchetto));
      if (!elenco.includes('index.html')) throw new Error('sw.js: manca index.html tra i file da conservare');
      // I nomi dei file cambiano quando cambia il loro contenuto; la pagina no, quindi conta anche lei
      const pagina = pacchetto['index.html'];
      const testoPagina = pagina?.type === 'asset' ? String(pagina.source) : '';
      const versione = createHash('sha256').update(elenco.join('\n')).update(testoPagina).digest('hex').slice(0, 12);
      const codice = readFileSync(percorso, 'utf8').replace('__ELENCO_FILE_APP__', JSON.stringify(elenco)).replace('__VERSIONE_APP__', versione);
      if (codice.includes('__ELENCO_FILE_APP__') || codice.includes('__VERSIONE_APP__')) throw new Error('sw.js: segnaposto non sostituiti');
      writeFileSync(percorso, codice);
    },
  };
}

export default defineConfig({
  // L'app vive nella cartella app/
  root: 'app',
  // Percorsi relativi: il sito vive in flyman-one.github.io/risparmia-pieno/
  base: './',
  plugins: [
    custodeConElencoFile(),
    {
      // In anteprima, "/campionario" e "/sistema" senza la barra finale portano
      // alla loro pagina invece che alla pagina principale.
      name: 'pagine-di-prova-senza-barra',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/campionario' || req.url === '/sistema') {
            res.statusCode = 301;
            res.setHeader('Location', `${req.url}/`);
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  // MapLibre carica un suo "aiutante" (worker) dalla propria cartella: va lasciato così com'è
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rolldownOptions: {
      // Due punti di partenza: la pagina dell'app e il suo custode (service worker), che sta
      // nella cartella principale con un nome fisso, sw.js, così può curare tutta l'app
      input: {
        index: fileURLToPath(new URL('app/index.html', import.meta.url)),
        sw: fileURLToPath(new URL('app/src/offline/sw.ts', import.meta.url)),
      },
      output: {
        entryFileNames: (pezzo) => (pezzo.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
  test: {
    // I test si cercano in tutto il progetto: cucina, app e condiviso
    root: '.',
    include: ['{app,cucina,condiviso}/**/*.test.ts'],
  },
});
