/**
 * Identidad visual de la encuesta.
 *
 * La interfaz usa los colores de Agricultura (el rojo de su isotipo «a») y La
 * Ruta Inmobiliaria aparece con su logotipo en blanco, que es la versión que
 * corresponde sobre fondo de color.
 *
 * Este archivo y `src/estilos/marca.css` son el ÚNICO lugar donde viven los
 * colores: pantalla de bienvenida, botones, tarjetas, títulos, barra de
 * progreso, estados seleccionados, confirmación y panel administrativo leen de
 * aquí. Si llega el manual de marca con los códigos exactos, se cambian estos
 * valores (y sus gemelos en `marca.css`) y toda la aplicación queda alineada
 * sin tocar componentes.
 */

export const MARCA = {
  radio: {
    nombre: 'Agricultura',
    /** Rojo del isotipo «a»: botones, estados seleccionados y acentos. */
    rojo: '#E23A42',
    rojoVivo: '#F4616A',
    rojoOscuro: '#B3212A',
    /** Granates del fondo y de los títulos. */
    granate: '#A81820',
    granateProfundo: '#7E1017',
    /** Superficies cálidas de apoyo. */
    rosa: '#F7CCD0',
    rosaSuave: '#FDEFF0',
    hueso: '#FDF7F7',
    blanco: '#FFFFFF',
  },
  ruta: {
    nombre: 'La Ruta Inmobiliaria',
    /** Azul del logotipo; se usa en su versión circular sobre fondo claro. */
    azul: '#1F4289',
  },
} as const;

/** Programa radial al que pertenece la encuesta y sus señales. */
export const PROGRAMA = {
  nombre: 'La Ruta Inmobiliaria',
  emisora: 'Agricultura',
  emisoraTv: 'Agricultura TV',
  horario: 'Sábados, 11:00 h',
} as const;
