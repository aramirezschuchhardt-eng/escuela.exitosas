/**
 * Cliente de la API. El navegador sólo habla con nuestro servidor: no conoce
 * ninguna credencial de correo ni la dirección de destino.
 */

import type { Estadisticas, RespuestaBorrador, RespuestaConEntregas } from '../compartido/tipos.ts';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

function url(ruta: string): string {
  return `${BASE}${ruta}`;
}

export interface ErrorEnvio extends Error {
  /** `true` cuando el problema es de red y conviene reintentar más tarde. */
  reintentable: boolean;
}

function errorEnvio(mensaje: string, reintentable: boolean): ErrorEnvio {
  const error = new Error(mensaje) as ErrorEnvio;
  error.reintentable = reintentable;
  return error;
}

/** Envía una respuesta terminada. Lanza `ErrorEnvio` si no se pudo guardar. */
export async function enviarRespuesta(borrador: RespuestaBorrador): Promise<{ id: string }> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url('/api/respuestas'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(borrador),
    });
  } catch {
    throw errorEnvio('No hay conexión con el servidor', true);
  }

  if (respuesta.status === 201) {
    return (await respuesta.json()) as { id: string };
  }

  // 4xx: el dato está mal y reintentarlo no sirve. 5xx: el servidor tuvo un
  // problema pasajero, así que la respuesta se guarda en la cola local.
  const reintentable = respuesta.status >= 500;
  throw errorEnvio(`El servidor respondió ${respuesta.status}`, reintentable);
}

/* ── Panel administrativo ───────────────────────────────────────────── */

const CLAVE_TOKEN = 'encuesta.token-admin';

export function tokenAdmin(): string {
  try {
    return sessionStorage.getItem(CLAVE_TOKEN) ?? '';
  } catch {
    return '';
  }
}

export function guardarTokenAdmin(token: string): void {
  try {
    sessionStorage.setItem(CLAVE_TOKEN, token);
  } catch {
    /* Modo privado del navegador: el token vive sólo en memoria. */
  }
}

async function pedirAdmin<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(url(ruta), {
    ...opciones,
    headers: {
      ...(opciones.body ? { 'content-type': 'application/json' } : {}),
      ...opciones.headers,
      'x-token-admin': tokenAdmin(),
    },
  });

  if (respuesta.status === 401) throw new Error('Token incorrecto');
  if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`);
  return (await respuesta.json()) as T;
}

export function cargarRespuestas(): Promise<{ total: number; respuestas: RespuestaConEntregas[] }> {
  return pedirAdmin('/api/admin/respuestas');
}

export function cargarEstadisticas(): Promise<Estadisticas> {
  return pedirAdmin('/api/admin/estadisticas');
}

export function reenviarCorreo(respuestaId: string): Promise<{ ok: boolean }> {
  return pedirAdmin('/api/admin/reenviar', {
    method: 'POST',
    body: JSON.stringify({ respuestaId, integracion: 'correo' }),
  });
}

export function reintentarPendientes(): Promise<{ reintentadas: number }> {
  return pedirAdmin('/api/admin/reintentar-pendientes', { method: 'POST' });
}

export function urlExportacion(): string {
  return url(`/api/admin/exportar.csv?token=${encodeURIComponent(tokenAdmin())}`);
}
