// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/nietzsche-penguin-the-game/',
  build: {
    outDir: 'dist',
  },
});
