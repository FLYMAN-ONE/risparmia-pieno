import { defineConfig } from 'vitest/config';

export default defineConfig({
  // L'app vive nella cartella app/
  root: 'app',
  // Percorsi relativi: il sito vive in flyman-one.github.io/risparmia-pieno/
  base: './',
  plugins: [
    {
      // In anteprima, "/campionario" senza la barra finale porta al campionario
      // invece che alla pagina principale.
      name: 'campionario-senza-barra',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/campionario') {
            res.statusCode = 301;
            res.setHeader('Location', '/campionario/');
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
