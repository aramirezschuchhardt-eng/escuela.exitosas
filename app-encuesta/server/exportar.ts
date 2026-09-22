/**
 * Exportación de respuestas a CSV. Se genera con punto y coma y BOM UTF-8
 * porque es el formato que Excel en español abre sin pasos intermedios; es
 * también la base para una futura exportación a XLSX o a Google Sheets.
 */

import { MOTIVOS_EXPO, TEMAS_RADIO, etiquetasDe } from '../src/compartido/definicion.ts';
import { formatearFechaCorta, formatearHora } from '../src/compartido/fechas.ts';
import type { Respuesta } from '../src/compartido/tipos.ts';

const COLUMNAS = [
  'Fecha',
  'Hora',
  'Nombre',
  'Apellido',
  'Teléfono',
  'Correo',
  'Comuna',
  'Temas de radio',
  'Motivos de la visita',
  'Autoriza comunicaciones',
  'Origen',
  'Id',
] as const;

function celda(valor: string): string {
  const texto = valor.replace(/"/g, '""');
  return /[;"\n]/.test(texto) ? `"${texto}"` : texto;
}

export function respuestasACsv(respuestas: Respuesta[]): string {
  const filas = respuestas.map((respuesta) =>
    [
      formatearFechaCorta(respuesta.creadaEn),
      formatearHora(respuesta.creadaEn),
      respuesta.participante.nombre,
      respuesta.participante.apellido,
      respuesta.participante.telefono,
      respuesta.participante.email,
      respuesta.participante.comuna,
      etiquetasDe(TEMAS_RADIO, respuesta.temasRadio).join(' | '),
      etiquetasDe(MOTIVOS_EXPO, respuesta.motivosExpo).join(' | '),
      respuesta.autorizaComunicaciones ? 'Sí' : 'No',
      respuesta.origen,
      respuesta.id,
    ]
      .map(celda)
      .join(';'),
  );

  return `﻿${[COLUMNAS.join(';'), ...filas].join('\r\n')}\r\n`;
}
