/**
 * Modo vista previa.
 *
 * Con `VITE_VISTA_PREVIA=1` la aplicación se compila sin servidor detrás: sirve
 * para publicarla como demostración (por ejemplo en GitHub Pages) y recorrerla
 * desde cualquier navegador. En ese modo NO se guarda ni se envía nada, y se
 * muestra un aviso permanente para que no se confunda con la encuesta real de
 * la Expo.
 */
export const VISTA_PREVIA = import.meta.env.VITE_VISTA_PREVIA === '1';
