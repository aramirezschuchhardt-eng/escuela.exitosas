/**
 * Cola local de respaldo.
 *
 * En la Expo el wifi puede fallar. Si el envío al servidor no resulta, la
 * respuesta se guarda en el propio navegador y se reintenta sola: la persona
 * ve igual su confirmación y el dato no se pierde. La cola se vacía apenas el
 * servidor vuelve a responder.
 */

import type { RespuestaBorrador } from '../compartido/tipos.ts';
import { enviarRespuesta, type ErrorEnvio } from './api.ts';

const CLAVE = 'encuesta.pendientes';

interface Pendiente {
  id: string;
  borrador: RespuestaBorrador;
  guardadaEn: string;
}

function leer(): Pendiente[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    const dato = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(dato) ? (dato as Pendiente[]) : [];
  } catch {
    return [];
  }
}

function escribir(pendientes: Pendiente[]): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(pendientes));
  } catch {
    /* Sin almacenamiento local no hay respaldo, pero la encuesta sigue. */
  }
}

export function encolar(borrador: RespuestaBorrador): void {
  const pendientes = leer();
  pendientes.push({
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    borrador,
    guardadaEn: new Date().toISOString(),
  });
  escribir(pendientes);
}

export function totalPendientes(): number {
  return leer().length;
}

/** Intenta enviar lo que quedó en la cola. Devuelve cuántas salieron. */
export async function vaciarCola(): Promise<number> {
  const pendientes = leer();
  if (pendientes.length === 0) return 0;

  const quedan: Pendiente[] = [];
  let enviadas = 0;

  for (const pendiente of pendientes) {
    try {
      await enviarRespuesta(pendiente.borrador);
      enviadas += 1;
    } catch (error) {
      // Si el rechazo es definitivo (datos inválidos) no tiene sentido
      // guardarla para siempre; cualquier otro error se reintenta después.
      if ((error as ErrorEnvio).reintentable !== false) quedan.push(pendiente);
    }
  }

  escribir(quedan);
  return enviadas;
}

/** Reintenta al cargar la aplicación, al recuperar la conexión y cada minuto. */
export function vigilarCola(): () => void {
  const intentar = () => {
    void vaciarCola();
  };

  intentar();
  const temporizador = setInterval(intentar, 60_000);
  window.addEventListener('online', intentar);

  return () => {
    clearInterval(temporizador);
    window.removeEventListener('online', intentar);
  };
}
