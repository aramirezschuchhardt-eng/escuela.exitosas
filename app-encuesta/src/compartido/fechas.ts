/**
 * Fechas y horas siempre en la zona horaria de Chile continental: la base de
 * datos guarda UTC, pero el correo y el panel se leen en Santiago.
 */

export const ZONA_HORARIA = 'America/Santiago';

const FECHA = new Intl.DateTimeFormat('es-CL', {
  timeZone: ZONA_HORARIA,
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const FECHA_CORTA = new Intl.DateTimeFormat('es-CL', {
  timeZone: ZONA_HORARIA,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const HORA = new Intl.DateTimeFormat('es-CL', {
  timeZone: ZONA_HORARIA,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** «22 de septiembre de 2026» */
export function formatearFecha(iso: string): string {
  return FECHA.format(new Date(iso));
}

/** «22-09-2026» */
export function formatearFechaCorta(iso: string): string {
  return FECHA_CORTA.format(new Date(iso));
}

/** «16:05 h» */
export function formatearHora(iso: string): string {
  return `${HORA.format(new Date(iso))} h`;
}

/** Día calendario en Chile (`AAAA-MM-DD`), útil para agrupar por jornada. */
export function diaChileno(iso: string): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
  return partes;
}
