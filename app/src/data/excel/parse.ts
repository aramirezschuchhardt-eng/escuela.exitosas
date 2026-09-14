import * as XLSX from 'xlsx';
import { autoMap, type CanonicalField } from './mapping';

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
  const wb = esTextoPlano(file)
    ? XLSX.read(decodificarTexto(buffer), { type: 'string', cellDates: true })
    : XLSX.read(buffer, { type: 'array', cellDates: true });

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
 * U+FFFD: el carácter que inserta `TextDecoder` cuando los bytes no son UTF-8
 * válido. Va como expresión regular y no como literal de texto para que el
 * carácter no quede incrustado tal cual en el bundle.
 */
const TIENE_CARACTER_DE_REEMPLAZO = /\ufffd/;

function esTextoPlano(file: File): boolean {
  return /\.(csv|tsv|txt)$/i.test(file.name) || file.type.startsWith('text/');
}

/**
 * Decodifica un CSV/TSV como texto.
 *
 * Los .xlsx guardan sus cadenas en UTF-8 dentro del XML, pero un .csv es bytes
 * sin declaración de codificación, y la librería los interpreta en latin1: un
 * archivo UTF-8 exportado desde Google Sheets o Excel llegaría con las tildes
 * rotas ("OrientaciÃ³n"). Se decodifica primero como UTF-8 y, si aparecen
 * caracteres de reemplazo, se reintenta como Windows-1252.
 */
function decodificarTexto(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (!TIENE_CARACTER_DE_REEMPLAZO.test(utf8)) return utf8;
  try {
    return new TextDecoder('windows-1252').decode(buffer);
  } catch {
    return utf8;
  }
}

/**
 * Encuentra la fila de encabezados.
 *
 * Las planillas comerciales suelen traer arriba un título, enlaces y notas
 * sueltas, así que buscar "la primera fila con dos textos" se equivoca. En su
 * lugar se puntúa cada una de las primeras filas por cuántos de sus textos son
 * encabezados reconocibles, y gana la de mayor puntaje. Si ninguna se reconoce,
 * se cae a la heurística simple.
 */
function encontrarFilaEncabezados(matrix: unknown[][]): number {
  const limite = Math.min(matrix.length, 40);
  let mejor = -1;
  let mejorPuntaje = 0;

  for (let i = 0; i < limite; i++) {
    const fila = (matrix[i] ?? []).map((c) =>
      typeof c === 'string' ? c.trim() : c == null ? '' : String(c),
    );
    const textos = fila.filter((c) => c.length > 0);
    if (textos.length < 2) continue;
    const mapeo = autoMap(textos);
    const reconocidos = Object.values(mapeo).filter(Boolean).length;
    // Se exige que buena parte de la fila sean encabezados, no sólo uno suelto.
    if (reconocidos >= 3 && reconocidos > mejorPuntaje) {
      mejorPuntaje = reconocidos;
      mejor = i;
    }
  }
  if (mejor !== -1) return mejor;

  for (let i = 0; i < limite; i++) {
    const fila = matrix[i] ?? [];
    if (fila.filter((c) => typeof c === 'string' && c.trim().length > 0).length >= 2) return i;
  }
  return -1;
}

function buildSheet(nombre: string, matrix: unknown[][]): SheetData {
  const headerIndex = encontrarFilaEncabezados(matrix);
  if (headerIndex === -1) return { nombre, headers: [], rows: [] };

  const crudos = matrix[headerIndex] ?? [];
  const headers: string[] = [];
  const vistos = new Map<string, number>();
  crudos.forEach((celda, idx) => {
    const texto = celda == null ? '' : String(celda).replace(/\s+/g, ' ').trim();
    const base = texto === '' ? `Columna ${idx + 1}` : texto;
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
