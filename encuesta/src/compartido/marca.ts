/**
 * Identidad visual de La Ruta Inmobiliaria.
 *
 * Este archivo y `src/estilos/marca.css` son el ÚNICO lugar donde viven los
 * colores de la aplicación: pantalla de bienvenida, botones, tarjetas, títulos,
 * barra de progreso, estados seleccionados, confirmación y panel administrativo
 * leen de aquí. Si llega el manual de marca con los códigos exactos, se cambian
 * estos valores (y sus gemelos en `marca.css`) y toda la aplicación queda
 * alineada sin tocar componentes.
 *
 * Radio Agricultura aparece como marca asociada en la barra superior; su rojo
 * se usa exclusivamente en ese logotipo, nunca como color de interfaz.
 */

export const MARCA = {
  ruta: {
    nombre: 'La Ruta Inmobiliaria',
    /** Azul profundo del logotipo: fondos y títulos. */
    azulNoche: '#06213C',
    azulProfundo: '#0A2E52',
    /** Azul principal de acción: botones y estados seleccionados. */
    azul: '#14528F',
    azulClaro: '#3E8FD6',
    /** Celeste de apoyo para fondos suaves y bordes. */
    celeste: '#D6E7F6',
    /** Dorado de la señalética del programa: acentos y progreso. */
    dorado: '#E9B23C',
    doradoOscuro: '#C98F1E',
    hueso: '#F4F7FB',
    blanco: '#FFFFFF',
  },
  radioAgricultura: {
    nombre: 'Radio Agricultura',
    rojo: '#C8102E',
  },
} as const;

/** Programa radial al que pertenece la encuesta. */
export const PROGRAMA = {
  nombre: 'La Ruta Inmobiliaria',
  emisora: 'Radio Agricultura',
  horario: 'Sábados, 11:00 h',
} as const;
