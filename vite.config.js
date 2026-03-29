// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/thus-waddled-zarathustra/',
  build: {
    outDir: 'dist',
  },
});
