/**
 * Carga de imágenes para el panel administrador.
 *
 * Las imágenes se guardan como data URL dentro de la base local. Para no agotar
 * la cuota de `localStorage` (unos pocos MB), se redimensionan y recomprimen
 * antes de guardarlas.
 */

const MAX_LADO = 1600;
const CALIDAD = 0.82;

export async function fileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen.');
  }
  // Los SVG no se rasterizan: se guardan tal cual.
  if (file.type === 'image/svg+xml') return leerComoDataUrl(file);

  const dataUrl = await leerComoDataUrl(file);
  const img = await cargarImagen(dataUrl);

  const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
  if (escala === 1 && file.size < 400_000) return dataUrl;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // PNG con transparencia (típico de logos) se conserva como PNG.
  const formato = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(formato, CALIDAD);
}

function leerComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No fue posible leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No fue posible procesar la imagen.'));
    img.src = src;
  });
}

/** Tamaño aproximado en KB de una data URL, para avisar al administrador. */
export function dataUrlSizeKB(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 3) / 4 / 1024);
}
