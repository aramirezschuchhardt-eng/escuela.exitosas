import * as XLSX from 'xlsx';
import type { CanonicalField } from './mapping';

export interface SheetData {
  nombre: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface WorkbookData {
  fileName: string;
  sheets: SheetData[];
}

/** Claves que nunca deben copiarse a un objeto (protección contra prototype pollution). */
const CLAVES_PROHIBIDAS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Lee un archivo .xlsx / .xls / .csv y devuelve sus hojas como filas crudas.
 *
 * No interpreta ni transforma valores: eso ocurre en `coerce*` más abajo, para
 * que la vista previa pueda mostrar exactamente lo que traía la planilla.
 */
export async function readWorkbook(file: File): Promise<WorkbookData> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const sheets: SheetData[] = wb.SheetNames.map((nombre) => {
    const sheet = wb.Sheets[nombre];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: null,
    });
    return buildSheet(nombre, matrix);
  }).filter((s) => s.headers.length > 0);

  return { fileName: file.name, sheets };
}

/**
 * Encuentra la fila de encabezados. Muchas planillas comerciales traen un título
 * o un logo en las primeras filas, así que se busca la primera fila que tenga al
 * menos dos celdas de texto no vacías.
 */
function buildSheet(nombre: string, matrix: unknown[][]): SheetData {
  let headerIndex = -1;
  for (let i = 0; i < Math.min(matrix.length, 30); i++) {
    const fila = matrix[i] ?? [];
    const textos = fila.filter((c) => typeof c === 'string' && c.trim().length > 0);
    if (textos.length >= 2) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) return { nombre, headers: [], rows: [] };

  const crudos = matrix[headerIndex] ?? [];
  const headers: string[] = [];
  const vistos = new Map<string, number>();
  crudos.forEach((celda, idx) => {
    const base =
      celda == null || String(celda).trim() === '' ? `Columna ${idx + 1}` : String(celda).trim();
    const n = vistos.get(base) ?? 0;
    vistos.set(base, n + 1);
    headers.push(n === 0 ? base : `${base} (${n + 1})`);
  });

  const rows: Record<string, unknown>[] = [];
  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const fila = matrix[i] ?? [];
    if (fila.every((c) => c == null || String(c).trim() === '')) continue;
    const obj: Record<string, unknown> = Object.create(null);
    headers.forEach((h, idx) => {
      if (CLAVES_PROHIBIDAS.has(h)) return;
      obj[h] = fila[idx] ?? null;
    });
    rows.push(obj);
  }

  return { nombre, headers, rows };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Conversión de valores de celda
 * ────────────────────────────────────────────────────────────────────────── */

export function coerceText(value: unknown): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  return t === '' ? null : t;
}

/**
 * Convierte una celda a número tolerando los formatos de planilla chilenos:
 * "UF 2.345,67", "$ 1.234", "2,345.67", "3.450", con separadores mezclados.
 */
export function coerceNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) return null;

  let t = String(value).trim();
  if (t === '' || t === '-' || t === '—') return null;

  const negativo = /^\(.*\)$/.test(t);
  t = t.replace(/[()]/g, '');
  t = t.replace(/(uf|clp|m2|m²|\$|%)/gi, '').replace(/\s/g, '');

  const tieneComa = t.includes(',');
  const tienePunto = t.includes('.');
  if (tieneComa && tienePunto) {
    // El separador decimal es el que aparece más a la derecha.
    t = t.lastIndexOf(',') > t.lastIndexOf('.')
      ? t.replace(/\./g, '').replace(',', '.')
      : t.replace(/,/g, '');
  } else if (tieneComa) {
    // Una sola coma con 1-2 decimales es separador decimal; si no, es de miles.
    const partes = t.split(',');
    t = partes.length === 2 && partes[1].length <= 2 ? t.replace(',', '.') : t.replace(/,/g, '');
  } else if (tienePunto) {
    const partes = t.split('.');
    // "2.345" con 3 dígitos tras el punto es separador de miles, no decimal.
    if (partes.length > 2 || (partes.length === 2 && partes[1].length === 3)) {
      t = t.replace(/\./g, '');
    }
  }

  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return negativo ? -n : n;
}

/**
 * Convierte una celda a fracción de porcentaje.
 * "5%" → 0,05 · 5 → 0,05 · 0,05 → 0,05 · "0,5%" → 0,005
 *
 * La heurística: un valor > 1 se interpreta como puntos porcentuales.
 */
export function coercePercent(value: unknown): number | null {
  if (value == null || value === '') return null;
  const esTextoConSimbolo = typeof value === 'string' && value.includes('%');
  const n = coerceNumber(value);
  if (n == null) return null;
  if (esTextoConSimbolo) return n / 100;
  return Math.abs(n) > 1 ? n / 100 : n;
}

export function coerceByType(
  value: unknown,
  type: 'text' | 'number' | 'percent' | 'status',
): string | number | null {
  switch (type) {
    case 'number':
      return coerceNumber(value);
    case 'percent':
      return coercePercent(value);
    default:
      return coerceText(value);
  }
}

export type MappedRow = Partial<Record<CanonicalField, string | number | null>> & {
  __raw: Record<string, unknown>;
  __fila: number;
};
