import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `base` relativo: los assets se referencian con rutas relativas, de modo que la
 * aplicación funciona tanto en la raíz del dominio como en un subdirectorio
 * (por ejemplo /cotizador/ en GitHub Pages) sin recompilar.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    /*
      El build se emite en /cotizador del repositorio para que GitHub Pages lo
      sirva en <sitio>/cotizador/, junto a la landing de Escuela Exitosas que
      vive en la raíz, sin interferir con ella.
    */
    outDir: '../cotizador',
    emptyOutDir: true,
    sourcemap: false,
  },
});
