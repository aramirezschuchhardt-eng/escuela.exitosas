/**
 * Registro y despacho de integraciones.
 *
 * El flujo al terminar la encuesta es siempre el mismo:
 *   guardar en la base de datos → responder al navegador → entregar en segundo
 *   plano → anotar el resultado de cada entrega.
 *
 * Así la persona nunca ve un error técnico y la información no se pierde aunque
 * el correo falle: la entrega queda «pendiente» y se reintenta sola.
 */

import { config } from '../config.ts';
import {
  actualizarEntrega,
  entregasNoCompletadas,
  obtenerRespuesta,
  registrarEntregaPendiente,
} from '../db.ts';
import type { Respuesta } from '../../src/compartido/tipos.ts';
import { integracionCorreo } from './correo.ts';
import { integracionWebhook } from './webhook.ts';
import type { Integracion } from './tipos.ts';

/** Para sumar una integración (Google Sheets, CRM, WhatsApp, email marketing,
 *  estadísticas externas…) basta con agregarla a esta lista. */
export const INTEGRACIONES: Integracion[] = [integracionCorreo, integracionWebhook];

export function integracionesActivas(): Integracion[] {
  return INTEGRACIONES.filter((integracion) => integracion.activa());
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mensajeDeError(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}

/** Intenta una integración con reintentos y deja el resultado en `entregas`. */
async function entregarConReintentos(integracion: Integracion, respuesta: Respuesta): Promise<void> {
  let intentos = 0;
  let ultimoError = '';

  while (intentos < config.entregas.intentos) {
    intentos += 1;
    try {
      await integracion.entregar(respuesta);
      actualizarEntrega(respuesta.id, integracion.nombre, 'enviada', intentos, null);
      return;
    } catch (error) {
      ultimoError = mensajeDeError(error);
      console.warn(
        `[${integracion.nombre}] intento ${intentos}/${config.entregas.intentos} falló para ${respuesta.id}: ${ultimoError}`,
      );
      actualizarEntrega(respuesta.id, integracion.nombre, 'pendiente', intentos, ultimoError);
      if (intentos < config.entregas.intentos) {
        await esperar(config.entregas.esperaBaseMs * 2 ** (intentos - 1));
      }
    }
  }

  actualizarEntrega(respuesta.id, integracion.nombre, 'fallida', intentos, ultimoError);
  console.error(
    `[${integracion.nombre}] respuesta ${respuesta.id} quedó sin entregar (guardada en la base de datos): ${ultimoError}`,
  );
}

/**
 * Despacha una respuesta a todas las integraciones activas. No se espera su
 * resultado para contestarle al navegador: se llama sin `await` desde la API.
 */
export async function despachar(respuesta: Respuesta): Promise<void> {
  const activas = integracionesActivas();
  for (const integracion of activas) {
    registrarEntregaPendiente(respuesta.id, integracion.nombre);
  }
  await Promise.all(activas.map((integracion) => entregarConReintentos(integracion, respuesta)));
}

/** Reintenta una integración puntual (lo usa el botón «reenviar» del panel). */
export async function reintentar(respuestaId: string, nombreIntegracion: string): Promise<boolean> {
  const respuesta = obtenerRespuesta(respuestaId);
  const integracion = INTEGRACIONES.find((candidata) => candidata.nombre === nombreIntegracion);
  if (!respuesta || !integracion || !integracion.activa()) return false;

  registrarEntregaPendiente(respuesta.id, integracion.nombre);
  await entregarConReintentos(integracion, respuesta);
  return true;
}

/**
 * Barrido periódico: recoge las entregas que quedaron pendientes o fallidas
 * (caída de internet en la Expo, servicio de correo caído, servidor reiniciado)
 * y las vuelve a intentar.
 */
export function iniciarBarridoDeEntregas(): NodeJS.Timeout {
  const temporizador = setInterval(() => {
    void barrerPendientes();
  }, config.entregas.barridoMs);
  temporizador.unref();
  return temporizador;
}

export async function barrerPendientes(): Promise<number> {
  const pendientes = entregasNoCompletadas();
  let reintentadas = 0;

  for (const entrega of pendientes) {
    const integracion = INTEGRACIONES.find((candidata) => candidata.nombre === entrega.integracion);
    const respuesta = obtenerRespuesta(entrega.respuestaId);
    if (!integracion || !integracion.activa() || !respuesta) continue;
    reintentadas += 1;
    await entregarConReintentos(integracion, respuesta);
  }

  if (reintentadas > 0) {
    console.info(`[entregas] se reintentaron ${reintentadas} entregas pendientes`);
  }
  return reintentadas;
}
