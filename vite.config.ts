import { defineConfig } from 'vitest/config';

export default defineConfig({
  // L'app vive nella cartella app/
  root: 'app',
  // Percorsi relativi: il sito vive in flyman-one.github.io/risparmia-pieno/
  base: './',
  plugins: [
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
  },
  test: {
    // I test si cercano in tutto il progetto: cucina, app e condiviso
    root: '.',
    include: ['{app,cucina,condiviso}/**/*.test.ts'],
  },
});
