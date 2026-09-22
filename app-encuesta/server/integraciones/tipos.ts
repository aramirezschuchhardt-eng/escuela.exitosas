/**
 * Contrato de una integración: cualquier destino al que deba llegar una
 * respuesta de la encuesta (hoy el correo y un webhook opcional; mañana Google
 * Sheets, un CRM, WhatsApp o una plataforma de email marketing).
 *
 * Reglas de la arquitectura:
 *   1. La respuesta se guarda en la base de datos ANTES de intentar cualquier
 *      integración; ninguna falla puede hacer perder el dato.
 *   2. Cada intento queda registrado en la tabla `entregas`, con su estado y su
 *      último error, para poder reintentar y para mostrarlo en el panel.
 *   3. Una integración nueva sólo tiene que implementar esta interfaz y
 *      registrarse en `registro.ts`.
 */

import type { Respuesta } from '../../src/compartido/tipos.ts';

export interface Integracion {
  /** Identificador estable; queda guardado en la tabla `entregas`. */
  nombre: string;
  /** Descripción para el panel administrativo y los logs. */
  descripcion: string;
  /** `false` cuando falta configuración: la integración se omite sin ruido. */
  activa: () => boolean;
  /** Entrega la respuesta. Debe lanzar una excepción si no lo consigue. */
  entregar: (respuesta: Respuesta) => Promise<void>;
  /** Marca las integraciones obligatorias del requerimiento: si fallan, el
   *  panel las muestra en rojo y se reintentan en cada barrido. */
  obligatoria: boolean;
}
