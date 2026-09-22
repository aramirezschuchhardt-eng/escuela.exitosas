/**
 * Configuración del servidor. Todo lo sensible (clave del servicio de correo,
 * usuario SMTP, token del panel) llega por variables de entorno: nada de esto
 * viaja al navegador ni queda escrito en el repositorio.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const RUTA_ENV = resolve(process.cwd(), '.env');
if (existsSync(RUTA_ENV)) {
  // Node carga el archivo sin dependencias externas.
  process.loadEnvFile(RUTA_ENV);
}

function texto(nombre: string, porDefecto = ''): string {
  return (process.env[nombre] ?? '').trim() || porDefecto;
}

function entero(nombre: string, porDefecto: number): number {
  const valor = Number.parseInt(texto(nombre), 10);
  return Number.isFinite(valor) ? valor : porDefecto;
}

function booleano(nombre: string, porDefecto: boolean): boolean {
  const valor = texto(nombre).toLowerCase();
  if (!valor) return porDefecto;
  return valor === '1' || valor === 'true' || valor === 'si' || valor === 'sí';
}

function lista(nombre: string): string[] {
  return texto(nombre)
    .split(/[,;]/)
    .map((parte) => parte.trim())
    .filter(Boolean);
}

/** Cómo se entrega el correo. `registro` sólo lo escribe en el log del
 *  servidor: sirve para desarrollo y para que la encuesta nunca se caiga por
 *  falta de credenciales. */
export type TransporteCorreo = 'resend' | 'smtp' | 'registro';

function transporteElegido(): TransporteCorreo {
  const explicito = texto('ENCUESTA_TRANSPORTE_CORREO').toLowerCase();
  if (explicito === 'resend' || explicito === 'smtp' || explicito === 'registro') return explicito;
  if (texto('RESEND_API_KEY')) return 'resend';
  if (texto('SMTP_HOST')) return 'smtp';
  return 'registro';
}

export const config = {
  puerto: entero('PORT', entero('ENCUESTA_PUERTO', 8787)),
  host: texto('ENCUESTA_HOST', '0.0.0.0'),

  /** Carpeta del build del cliente que el servidor publica. */
  rutaEstaticos: resolve(process.cwd(), texto('ENCUESTA_ESTATICOS', 'dist')),
  rutaBaseDatos: resolve(process.cwd(), texto('ENCUESTA_BASE_DATOS', 'datos/encuesta.sqlite')),

  correo: {
    /** Destino obligatorio de cada respuesta de la encuesta. */
    destino: texto('ENCUESTA_CORREO_DESTINO', 'Alison@larutainmobiliaria.cl'),
    copias: lista('ENCUESTA_CORREO_COPIA'),
    remitente: texto(
      'ENCUESTA_CORREO_REMITENTE',
      'Encuesta La Ruta Inmobiliaria <encuesta@larutainmobiliaria.cl>',
    ),
    /** Si se responde el correo, la respuesta llega al participante. */
    responderAlParticipante: booleano('ENCUESTA_CORREO_RESPONDER_AL_PARTICIPANTE', true),
    transporte: transporteElegido(),
    resendApiKey: texto('RESEND_API_KEY'),
    smtp: {
      host: texto('SMTP_HOST'),
      puerto: entero('SMTP_PORT', 587),
      seguro: booleano('SMTP_SECURE', entero('SMTP_PORT', 587) === 465),
      usuario: texto('SMTP_USER'),
      clave: texto('SMTP_PASS'),
    },
  },

  entregas: {
    /** Intentos por integración antes de dejar la entrega como fallida. */
    intentos: entero('ENCUESTA_INTENTOS_ENTREGA', 4),
    /** Espera base entre intentos, en milisegundos (crece exponencialmente). */
    esperaBaseMs: entero('ENCUESTA_ESPERA_ENTREGA_MS', 2_000),
    /** Cada cuánto se reintentan en segundo plano las entregas pendientes. */
    barridoMs: entero('ENCUESTA_BARRIDO_ENTREGAS_MS', 120_000),
  },

  /** Token del panel administrativo. Si queda vacío, el panel sólo se puede
   *  usar desde la misma máquina (localhost). */
  tokenAdmin: texto('ENCUESTA_TOKEN_ADMIN'),
} as const;

export function resumenConfig(): string {
  const correo =
    config.correo.transporte === 'registro'
      ? 'registro en consola (sin credenciales configuradas)'
      : config.correo.transporte;
  return [
    `puerto ${config.puerto}`,
    `base de datos ${config.rutaBaseDatos}`,
    `correo → ${config.correo.destino} vía ${correo}`,
    `panel ${config.tokenAdmin ? 'con token' : 'sólo localhost'}`,
  ].join(' · ');
}
