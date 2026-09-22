import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `base` relativo para poder servir la encuesta tanto en la raíz del dominio
 * como en un subdirectorio. En desarrollo, todo lo que empieza con /api se
 * reenvía al servidor Node (que es quien guarda y envía los correos), de modo
 * que el navegador nunca necesita credenciales.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
