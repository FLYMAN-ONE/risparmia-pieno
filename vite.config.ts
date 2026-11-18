import { defineConfig } from 'vitest/config';

export default defineConfig({
  // L'app vive nella cartella app/
  root: 'app',
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
