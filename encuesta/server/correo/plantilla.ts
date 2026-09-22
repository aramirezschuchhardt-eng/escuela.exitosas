/**
 * Armado del correo que recibe La Ruta Inmobiliaria por cada participante.
 * El asunto y el orden de las secciones están fijados por el requerimiento:
 * datos del participante, temas de radio, motivo de la visita y datos del
 * registro. Se envía en texto plano y en HTML con los colores de la marca.
 */

import { MARCA } from '../../src/compartido/marca.ts';
import { MOTIVOS_EXPO, TEMAS_RADIO, etiquetasDe } from '../../src/compartido/definicion.ts';
import { formatearFecha, formatearHora } from '../../src/compartido/fechas.ts';
import type { Respuesta } from '../../src/compartido/tipos.ts';

export const ASUNTO_CORREO = 'Nuevo participante — Encuesta La Ruta Inmobiliaria Expo';

export interface CorreoArmado {
  asunto: string;
  texto: string;
  html: string;
}

function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function seleccionadas(respuesta: Respuesta): { temas: string[]; motivos: string[] } {
  return {
    temas: etiquetasDe(TEMAS_RADIO, respuesta.temasRadio),
    motivos: etiquetasDe(MOTIVOS_EXPO, respuesta.motivosExpo),
  };
}

function bloqueTexto(titulo: string, valor: string): string {
  return `${titulo}:\n${valor || '—'}`;
}

/** Versión en texto plano, con el mismo formato del requerimiento. */
export function textoDelCorreo(respuesta: Respuesta): string {
  const { participante } = respuesta;
  const { temas, motivos } = seleccionadas(respuesta);
  const marcas = (etiquetas: string[]) =>
    etiquetas.length > 0 ? etiquetas.map((etiqueta) => `☑ ${etiqueta}`).join('\n') : '— Sin alternativas marcadas';

  return [
    '👤 DATOS DEL PARTICIPANTE',
    '',
    bloqueTexto('Nombre', participante.nombre),
    '',
    bloqueTexto('Apellido', participante.apellido),
    '',
    bloqueTexto('Teléfono', participante.telefono),
    '',
    bloqueTexto('Correo', participante.email),
    '',
    bloqueTexto('Comuna', participante.comuna),
    '',
    '',
    '🎙️ ¿QUÉ LE GUSTARÍA ESCUCHAR EN LA RADIO?',
    '',
    marcas(temas),
    '',
    '',
    '🏢 ¿POR QUÉ VINO A LA EXPO?',
    '',
    marcas(motivos),
    '',
    '',
    '📅 DATOS DEL REGISTRO',
    '',
    bloqueTexto('Fecha', formatearFecha(respuesta.creadaEn)),
    '',
    bloqueTexto('Hora', formatearHora(respuesta.creadaEn)),
    '',
    bloqueTexto('Origen', respuesta.origen),
    '',
    bloqueTexto('Autorización de comunicaciones', respuesta.autorizaComunicaciones ? 'Sí' : 'No'),
    '',
  ].join('\n');
}

function filaHtml(titulo: string, valor: string): string {
  return `
    <tr>
      <td style="padding:10px 0 0;font:600 12px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:${MARCA.ruta.azul}">
        ${escapar(titulo)}
      </td>
    </tr>
    <tr>
      <td style="padding:2px 0 10px;border-bottom:1px solid ${MARCA.ruta.celeste};font:400 17px/1.4 Arial,Helvetica,sans-serif;color:${MARCA.ruta.azulNoche}">
        ${escapar(valor) || '&mdash;'}
      </td>
    </tr>`;
}

function seccionHtml(titulo: string, contenido: string): string {
  return `
    <tr>
      <td style="padding:26px 28px 0">
        <p style="margin:0 0 6px;font:700 15px/1.3 Arial,Helvetica,sans-serif;color:${MARCA.ruta.azulNoche}">
          ${titulo}
        </p>
        <div style="height:3px;width:52px;background:${MARCA.ruta.dorado};border-radius:2px"></div>
        ${contenido}
      </td>
    </tr>`;
}

function listaHtml(etiquetas: string[]): string {
  if (etiquetas.length === 0) {
    return `<p style="margin:12px 0 0;font:400 16px/1.5 Arial,Helvetica,sans-serif;color:#6B7A8D">Sin alternativas marcadas</p>`;
  }
  const items = etiquetas
    .map(
      (etiqueta) => `
      <tr>
        <td style="padding:7px 10px 7px 0;vertical-align:top;font:700 16px/1.4 Arial,Helvetica,sans-serif;color:${MARCA.ruta.azul}">☑</td>
        <td style="padding:7px 0;font:400 16px/1.4 Arial,Helvetica,sans-serif;color:${MARCA.ruta.azulNoche}">${escapar(etiqueta)}</td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;width:100%">${items}</table>`;
}

/** Versión HTML con la identidad de La Ruta Inmobiliaria. */
export function htmlDelCorreo(respuesta: Respuesta): string {
  const { participante } = respuesta;
  const { temas, motivos } = seleccionadas(respuesta);

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px 12px;background:${MARCA.ruta.hueso}">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;width:100%;max-width:620px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid ${MARCA.ruta.celeste}">
      <tr>
        <td style="padding:26px 28px;background:${MARCA.ruta.azulNoche}">
          <p style="margin:0;font:700 11px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:${MARCA.ruta.dorado}">
            ${escapar(MARCA.radioAgricultura.nombre)}
          </p>
          <p style="margin:6px 0 0;font:700 25px/1.2 Arial,Helvetica,sans-serif;color:#fff">
            ${escapar(MARCA.ruta.nombre)}
          </p>
          <p style="margin:6px 0 0;font:400 14px/1.4 Arial,Helvetica,sans-serif;color:${MARCA.ruta.celeste}">
            Nuevo participante de la encuesta en la Expo
          </p>
        </td>
      </tr>
      ${seccionHtml(
        '👤 DATOS DEL PARTICIPANTE',
        `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
          ${filaHtml('Nombre', participante.nombre)}
          ${filaHtml('Apellido', participante.apellido)}
          ${filaHtml('Teléfono', participante.telefono)}
          ${filaHtml('Correo', participante.email)}
          ${filaHtml('Comuna', participante.comuna)}
        </table>`,
      )}
      ${seccionHtml('🎙️ ¿QUÉ LE GUSTARÍA ESCUCHAR EN LA RADIO?', listaHtml(temas))}
      ${seccionHtml('🏢 ¿POR QUÉ VINO A LA EXPO?', listaHtml(motivos))}
      ${seccionHtml(
        '📅 DATOS DEL REGISTRO',
        `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
          ${filaHtml('Fecha', formatearFecha(respuesta.creadaEn))}
          ${filaHtml('Hora', formatearHora(respuesta.creadaEn))}
          ${filaHtml('Origen', respuesta.origen)}
          ${filaHtml('Autorización de comunicaciones', respuesta.autorizaComunicaciones ? 'Sí' : 'No')}
        </table>`,
      )}
      <tr>
        <td style="padding:24px 28px 30px">
          <p style="margin:0;font:400 12px/1.5 Arial,Helvetica,sans-serif;color:#6B7A8D">
            Registro ${escapar(respuesta.id)} · Enviado automáticamente por la encuesta de ${escapar(MARCA.ruta.nombre)}.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function armarCorreo(respuesta: Respuesta): CorreoArmado {
  return {
    asunto: ASUNTO_CORREO,
    texto: textoDelCorreo(respuesta),
    html: htmlDelCorreo(respuesta),
  };
}
