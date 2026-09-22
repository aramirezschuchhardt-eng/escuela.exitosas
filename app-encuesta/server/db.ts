/**
 * Persistencia en SQLite (módulo `node:sqlite`, sin dependencias nativas). Es
 * la capa que garantiza el requisito central: la respuesta queda guardada
 * aunque el correo falle.
 *
 * Toda la aplicación habla con la base de datos a través de las funciones de
 * este archivo. Para migrar a Postgres, Supabase u otro motor basta con
 * reimplementarlas manteniendo las firmas.
 */

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

import { config } from './config.ts';
import { MOTIVOS_EXPO, TEMAS_RADIO } from '../src/compartido/definicion.ts';
import { diaChileno } from '../src/compartido/fechas.ts';
import type {
  ConteoOpcion,
  Entrega,
  EstadoEntrega,
  Estadisticas,
  Respuesta,
  RespuestaBorrador,
  RespuestaConEntregas,
} from '../src/compartido/tipos.ts';

mkdirSync(dirname(config.rutaBaseDatos), { recursive: true });

const db = new DatabaseSync(config.rutaBaseDatos);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS respuestas (
    id                      TEXT PRIMARY KEY,
    creada_en               TEXT NOT NULL,
    origen                  TEXT NOT NULL,
    nombre                  TEXT NOT NULL,
    apellido                TEXT NOT NULL,
    telefono                TEXT NOT NULL,
    email                   TEXT NOT NULL,
    comuna                  TEXT NOT NULL,
    temas_radio             TEXT NOT NULL,
    motivos_expo            TEXT NOT NULL,
    autoriza_comunicaciones INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS respuestas_creada_en ON respuestas (creada_en DESC);

  CREATE TABLE IF NOT EXISTS entregas (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    respuesta_id   TEXT NOT NULL REFERENCES respuestas (id) ON DELETE CASCADE,
    integracion    TEXT NOT NULL,
    estado         TEXT NOT NULL,
    intentos       INTEGER NOT NULL DEFAULT 0,
    ultimo_error   TEXT,
    creada_en      TEXT NOT NULL,
    actualizada_en TEXT NOT NULL,
    UNIQUE (respuesta_id, integracion)
  );

  CREATE INDEX IF NOT EXISTS entregas_estado ON entregas (estado, actualizada_en);
`);

type FilaRespuesta = {
  id: string;
  creada_en: string;
  origen: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  comuna: string;
  temas_radio: string;
  motivos_expo: string;
  autoriza_comunicaciones: number;
};

type FilaEntrega = {
  id: number;
  respuesta_id: string;
  integracion: string;
  estado: string;
  intentos: number;
  ultimo_error: string | null;
  creada_en: string;
  actualizada_en: string;
};

function listaJson(valor: string): string[] {
  try {
    const dato = JSON.parse(valor);
    return Array.isArray(dato) ? dato.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function aRespuesta(fila: FilaRespuesta): Respuesta {
  return {
    id: fila.id,
    creadaEn: fila.creada_en,
    origen: fila.origen,
    participante: {
      nombre: fila.nombre,
      apellido: fila.apellido,
      telefono: fila.telefono,
      email: fila.email,
      comuna: fila.comuna,
    },
    temasRadio: listaJson(fila.temas_radio),
    motivosExpo: listaJson(fila.motivos_expo),
    autorizaComunicaciones: fila.autoriza_comunicaciones === 1,
  };
}

function aEntrega(fila: FilaEntrega): Entrega {
  return {
    id: fila.id,
    respuestaId: fila.respuesta_id,
    integracion: fila.integracion,
    estado: (['pendiente', 'enviada', 'fallida'].includes(fila.estado) ? fila.estado : 'pendiente') as EstadoEntrega,
    intentos: fila.intentos,
    ultimoError: fila.ultimo_error,
    creadaEn: fila.creada_en,
    actualizadaEn: fila.actualizada_en,
  };
}

const insertarRespuesta = db.prepare(`
  INSERT INTO respuestas (
    id, creada_en, origen, nombre, apellido, telefono, email, comuna,
    temas_radio, motivos_expo, autoriza_comunicaciones
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

/** Guarda la respuesta y devuelve la fila completa. Es lo PRIMERO que ocurre
 *  al terminar la encuesta: recién después se intenta el correo. */
export function guardarRespuesta(borrador: RespuestaBorrador, origen: string): Respuesta {
  const respuesta: Respuesta = {
    id: randomUUID(),
    creadaEn: new Date().toISOString(),
    origen,
    ...borrador,
  };

  insertarRespuesta.run(
    respuesta.id,
    respuesta.creadaEn,
    respuesta.origen,
    respuesta.participante.nombre,
    respuesta.participante.apellido,
    respuesta.participante.telefono,
    respuesta.participante.email,
    respuesta.participante.comuna,
    JSON.stringify(respuesta.temasRadio),
    JSON.stringify(respuesta.motivosExpo),
    respuesta.autorizaComunicaciones ? 1 : 0,
  );

  return respuesta;
}

export function obtenerRespuesta(id: string): Respuesta | null {
  const fila = db.prepare('SELECT * FROM respuestas WHERE id = ?').get(id) as FilaRespuesta | undefined;
  return fila ? aRespuesta(fila) : null;
}

export function listarRespuestas(limite = 200, desplazamiento = 0): RespuestaConEntregas[] {
  const filas = db
    .prepare('SELECT * FROM respuestas ORDER BY creada_en DESC LIMIT ? OFFSET ?')
    .all(limite, desplazamiento) as FilaRespuesta[];

  return filas.map((fila) => ({
    ...aRespuesta(fila),
    entregas: entregasDe(fila.id),
  }));
}

export function todasLasRespuestas(): Respuesta[] {
  const filas = db.prepare('SELECT * FROM respuestas ORDER BY creada_en DESC').all() as FilaRespuesta[];
  return filas.map(aRespuesta);
}

export function totalRespuestas(): number {
  const fila = db.prepare('SELECT COUNT(*) AS total FROM respuestas').get() as { total: number };
  return fila.total;
}

/* ── Entregas a integraciones ─────────────────────────────────────────── */

export function registrarEntregaPendiente(respuestaId: string, integracion: string): Entrega {
  const ahora = new Date().toISOString();
  db.prepare(
    `INSERT INTO entregas (respuesta_id, integracion, estado, intentos, creada_en, actualizada_en)
     VALUES (?, ?, 'pendiente', 0, ?, ?)
     ON CONFLICT (respuesta_id, integracion)
     DO UPDATE SET estado = 'pendiente', actualizada_en = excluded.actualizada_en`,
  ).run(respuestaId, integracion, ahora, ahora);

  const fila = db
    .prepare('SELECT * FROM entregas WHERE respuesta_id = ? AND integracion = ?')
    .get(respuestaId, integracion) as FilaEntrega;
  return aEntrega(fila);
}

export function actualizarEntrega(
  respuestaId: string,
  integracion: string,
  estado: EstadoEntrega,
  intentos: number,
  ultimoError: string | null,
): void {
  db.prepare(
    `UPDATE entregas
        SET estado = ?, intentos = ?, ultimo_error = ?, actualizada_en = ?
      WHERE respuesta_id = ? AND integracion = ?`,
  ).run(estado, intentos, ultimoError, new Date().toISOString(), respuestaId, integracion);
}

export function entregasDe(respuestaId: string): Entrega[] {
  const filas = db
    .prepare('SELECT * FROM entregas WHERE respuesta_id = ? ORDER BY integracion')
    .all(respuestaId) as FilaEntrega[];
  return filas.map(aEntrega);
}

/** Entregas que quedaron a medio camino (por ejemplo, porque se cortó internet
 *  en plena Expo) para volver a intentarlas. */
export function entregasNoCompletadas(limite = 50): Entrega[] {
  const filas = db
    .prepare(
      `SELECT * FROM entregas
        WHERE estado IN ('pendiente', 'fallida')
        ORDER BY actualizada_en ASC
        LIMIT ?`,
    )
    .all(limite) as FilaEntrega[];
  return filas.map(aEntrega);
}

/* ── Estadísticas ─────────────────────────────────────────────────────── */

function conteos(opciones: { id: string; etiqueta: string }[], seleccionesPorRespuesta: string[][]): ConteoOpcion[] {
  const acumulado = new Map<string, number>();
  for (const selecciones of seleccionesPorRespuesta) {
    for (const id of selecciones) acumulado.set(id, (acumulado.get(id) ?? 0) + 1);
  }
  const conocidos = opciones.map((opcion) => ({
    id: opcion.id,
    etiqueta: opcion.etiqueta,
    total: acumulado.get(opcion.id) ?? 0,
  }));
  return conocidos.sort((a, b) => b.total - a.total);
}

/**
 * Estadísticas en vivo del panel. Se calculan sobre todas las respuestas: el
 * volumen de una Expo (cientos o unos pocos miles de filas) lo permite sin
 * complicar el esquema, y así las alternativas se cuentan con las etiquetas
 * actuales de la definición.
 */
export function estadisticas(): Estadisticas {
  const respuestas = todasLasRespuestas();
  const hoy = diaChileno(new Date().toISOString());

  const porComuna = new Map<string, number>();
  for (const respuesta of respuestas) {
    const comuna = respuesta.participante.comuna || 'Sin indicar';
    porComuna.set(comuna, (porComuna.get(comuna) ?? 0) + 1);
  }

  const estadosCorreo = db
    .prepare(`SELECT estado, COUNT(*) AS total FROM entregas WHERE integracion = 'correo' GROUP BY estado`)
    .all() as { estado: string; total: number }[];
  const porEstado = (estado: string) => estadosCorreo.find((fila) => fila.estado === estado)?.total ?? 0;

  return {
    totalRespuestas: respuestas.length,
    respuestasHoy: respuestas.filter((respuesta) => diaChileno(respuesta.creadaEn) === hoy).length,
    autorizanComunicaciones: respuestas.filter((respuesta) => respuesta.autorizaComunicaciones).length,
    temasRadio: conteos(TEMAS_RADIO, respuestas.map((r) => r.temasRadio)),
    motivosExpo: conteos(MOTIVOS_EXPO, respuestas.map((r) => r.motivosExpo)),
    comunas: [...porComuna.entries()]
      .map(([comuna, total]) => ({ id: comuna, etiqueta: comuna, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12),
    correosEnviados: porEstado('enviada'),
    correosPendientes: porEstado('pendiente'),
    correosFallidos: porEstado('fallida'),
    ultimaRespuestaEn: respuestas[0]?.creadaEn ?? null,
  };
}
