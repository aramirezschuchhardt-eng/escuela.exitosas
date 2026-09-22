/**
 * Integración opcional y genérica: publica la respuesta como JSON en una URL.
 *
 * Es el punto de entrada para las automatizaciones futuras sin tocar el código:
 * un webhook de Zapier, Make o n8n conectado a Google Sheets, a un CRM, a
 * WhatsApp o a una herramienta de email marketing. Se activa con
 * `ENCUESTA_WEBHOOK_URL` (y opcionalmente `ENCUESTA_WEBHOOK_TOKEN`).
 */

import { etiquetasDe, MOTIVOS_EXPO, TEMAS_RADIO } from '../../src/compartido/definicion.ts';
import { formatearFecha, formatearHora } from '../../src/compartido/fechas.ts';
import type { Integracion } from './tipos.ts';

const URL_WEBHOOK = (process.env.ENCUESTA_WEBHOOK_URL ?? '').trim();
const TOKEN_WEBHOOK = (process.env.ENCUESTA_WEBHOOK_TOKEN ?? '').trim();

export const integracionWebhook: Integracion = {
  nombre: 'webhook',
  descripcion: 'Publica la respuesta en una URL externa (Sheets, CRM, WhatsApp, automatizaciones)',
  obligatoria: false,
  activa: () => URL_WEBHOOK.length > 0,
  entregar: async (respuesta) => {
    const carga = {
      id: respuesta.id,
      creadaEn: respuesta.creadaEn,
      fecha: formatearFecha(respuesta.creadaEn),
      hora: formatearHora(respuesta.creadaEn),
      origen: respuesta.origen,
      ...respuesta.participante,
      temasRadio: etiquetasDe(TEMAS_RADIO, respuesta.temasRadio),
      motivosExpo: etiquetasDe(MOTIVOS_EXPO, respuesta.motivosExpo),
      autorizaComunicaciones: respuesta.autorizaComunicaciones,
    };

    const salida = await fetch(URL_WEBHOOK, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(TOKEN_WEBHOOK ? { authorization: `Bearer ${TOKEN_WEBHOOK}` } : {}),
      },
      body: JSON.stringify(carga),
      signal: AbortSignal.timeout(15_000),
    });

    if (!salida.ok) {
      throw new Error(`El webhook respondió ${salida.status}`);
    }
  },
};
