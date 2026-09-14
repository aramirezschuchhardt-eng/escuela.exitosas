import { normalizeStatus } from '../../domain/units';
import type { Unit } from '../../domain/types';
import { coerceByType, type SheetData } from './parse';
import { FIELD_SPECS, type CanonicalField } from './mapping';

export type ChangeKind = 'nueva' | 'actualizada' | 'estado' | 'sin-cambios' | 'invalida';

export interface FieldChange {
  field: CanonicalField;
  label: string;
  antes: unknown;
  despues: unknown;
}

export interface DiffRow {
  kind: ChangeKind;
  fila: number;
  departamento: string;
  /** Unidad existente en el stock, si la hubiera. */
  existente: Unit | null;
  /** Unidad resultante si se confirma la importación. */
  resultante: Unit | null;
  cambios: FieldChange[];
  errores: string[];
}

export interface ImportPreview {
  totalFilas: number;
  nuevas: number;
  actualizadas: number;
  cambiosDeEstado: number;
  sinCambios: number;
  invalidas: number;
  /** Departamentos del stock actual que no aparecen en la planilla. */
  ausentes: Unit[];
  rows: DiffRow[];
  columnasNoMapeadas: string[];
}

const CAMPOS_COMPARABLES: CanonicalField[] = [
  'piso',
  'modelo',
  'tipologia',
  'dormitorios',
  'banos',
  'orientacion',
  'superficieUtil',
  'superficieTerraza',
  'superficieTotal',
  'precioListaUF',
  'descuentoPct',
  'descuentoMontoUF',
  'precioConDescuentoUF',
];

const SPEC_BY_FIELD = new Map(FIELD_SPECS.map((s) => [s.field, s]));

function equivalentes(a: unknown, b: unknown): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-6;
  return String(a).trim() === String(b).trim();
}

/**
 * Construye la vista previa de la importación.
 *
 * No modifica nada: devuelve el detalle de lo que ocurriría, para que el
 * administrador confirme antes de ejecutar.
 */
export function buildPreview(params: {
  sheet: SheetData;
  mapping: Record<string, CanonicalField | null>;
  projectId: string;
  unidadesActuales: Unit[];
  /** Si la planilla trae varios proyectos, filtrar por este nombre. */
  filtroProyecto?: string | null;
}): ImportPreview {
  const { sheet, mapping, projectId, unidadesActuales, filtroProyecto } = params;

  const porDepartamento = new Map<string, Unit>();
  for (const u of unidadesActuales) {
    if (u.projectId === projectId) {
      porDepartamento.set(u.departamento.trim().toUpperCase(), u);
    }
  }

  const columnasNoMapeadas = Object.entries(mapping)
    .filter(([, field]) => field == null)
    .map(([header]) => header);

  const rows: DiffRow[] = [];
  const vistos = new Set<string>();
  const duplicados = new Set<string>();

  sheet.rows.forEach((raw, index) => {
    const fila = index + 1;
    const valores: Partial<Record<CanonicalField, string | number | null>> = {};
    for (const [header, field] of Object.entries(mapping)) {
      if (!field) continue;
      const spec = SPEC_BY_FIELD.get(field);
      valores[field] = coerceByType(raw[header], spec?.type ?? 'text');
    }

    // Filtro por proyecto cuando la planilla mezcla varios.
    if (filtroProyecto && valores.proyecto) {
      if (String(valores.proyecto).trim().toLowerCase() !== filtroProyecto.trim().toLowerCase()) {
        return;
      }
    }

    const departamento = valores.departamento != null ? String(valores.departamento).trim() : '';
    const errores: string[] = [];
    if (!departamento) errores.push('Fila sin identificador de departamento.');

    const clave = departamento.toUpperCase();
    if (clave) {
      if (vistos.has(clave)) {
        duplicados.add(clave);
        errores.push('Departamento duplicado dentro de la planilla.');
      }
      vistos.add(clave);
    }

    const tienePrecio =
      valores.precioListaUF != null || valores.precioConDescuentoUF != null;
    if (!tienePrecio) {
      errores.push('Fila sin precio (no se podrá cotizar hasta que se cargue).');
    }

    if (!departamento) {
      rows.push({
        kind: 'invalida',
        fila,
        departamento: '—',
        existente: null,
        resultante: null,
        cambios: [],
        errores,
      });
      return;
    }

    const existente = porDepartamento.get(clave) ?? null;
    const estado = normalizeStatus(valores.estado);

    const resultante: Unit = {
      id: existente?.id ?? crypto.randomUUID(),
      projectId,
      departamento,
      piso: numOrKeep(valores.piso, existente?.piso),
      modelo: strOrKeep(valores.modelo, existente?.modelo),
      tipologia: strOrKeep(valores.tipologia, existente?.tipologia),
      dormitorios: numOrKeep(valores.dormitorios, existente?.dormitorios),
      banos: numOrKeep(valores.banos, existente?.banos),
      orientacion: strOrKeep(valores.orientacion, existente?.orientacion),
      superficieUtil: numOrKeep(valores.superficieUtil, existente?.superficieUtil),
      superficieTerraza: numOrKeep(valores.superficieTerraza, existente?.superficieTerraza),
      superficieTotal: numOrKeep(valores.superficieTotal, existente?.superficieTotal),
      precioListaUF: numOrKeep(valores.precioListaUF, existente?.precioListaUF),
      descuentoPct: numOrKeep(valores.descuentoPct, existente?.descuentoPct),
      descuentoMontoUF: numOrKeep(valores.descuentoMontoUF, existente?.descuentoMontoUF),
      precioConDescuentoUF: numOrKeep(
        valores.precioConDescuentoUF,
        existente?.precioConDescuentoUF,
      ),
      estado: valores.estado != null ? estado.estado : (existente?.estado ?? 'DESCONOCIDO'),
      estadoOriginal: valores.estado != null ? estado.original : (existente?.estadoOriginal ?? null),
      // Los datos comerciales que no vienen de la planilla se conservan.
      bonoPiePct: existente?.bonoPiePct ?? null,
      extra: buildExtra(raw, mapping, existente?.extra),
      source: 'excel',
      updatedAt: new Date().toISOString(),
    };

    const cambios: FieldChange[] = [];
    if (existente) {
      for (const field of CAMPOS_COMPARABLES) {
        const antes = existente[field as keyof Unit];
        const despues = resultante[field as keyof Unit];
        if (!equivalentes(antes, despues)) {
          cambios.push({
            field,
            label: SPEC_BY_FIELD.get(field)?.label ?? field,
            antes,
            despues,
          });
        }
      }
    }

    const cambioEstado = existente != null && existente.estado !== resultante.estado;
    if (cambioEstado) {
      cambios.push({
        field: 'estado',
        label: 'Estado',
        antes: existente!.estado,
        despues: resultante.estado,
      });
    }

    let kind: ChangeKind;
    if (errores.length > 0 && !departamento) kind = 'invalida';
    else if (!existente) kind = 'nueva';
    else if (cambioEstado) kind = 'estado';
    else if (cambios.length > 0) kind = 'actualizada';
    else kind = 'sin-cambios';

    rows.push({ kind, fila, departamento, existente, resultante, cambios, errores });
  });

  const departamentosEnPlanilla = new Set(rows.map((r) => r.departamento.toUpperCase()));
  const ausentes = [...porDepartamento.entries()]
    .filter(([clave]) => !departamentosEnPlanilla.has(clave))
    .map(([, unit]) => unit);

  return {
    totalFilas: rows.length,
    nuevas: rows.filter((r) => r.kind === 'nueva').length,
    actualizadas: rows.filter((r) => r.kind === 'actualizada').length,
    cambiosDeEstado: rows.filter((r) => r.kind === 'estado').length,
    sinCambios: rows.filter((r) => r.kind === 'sin-cambios').length,
    invalidas: rows.filter((r) => r.kind === 'invalida').length,
    ausentes,
    rows,
    columnasNoMapeadas,
  };
}

function numOrKeep(nuevo: unknown, anterior: number | null | undefined): number | null {
  if (typeof nuevo === 'number' && Number.isFinite(nuevo)) return nuevo;
  if (nuevo == null) return anterior ?? null;
  const n = Number(nuevo);
  return Number.isFinite(n) ? n : (anterior ?? null);
}

function strOrKeep(nuevo: unknown, anterior: string | null | undefined): string | null {
  if (nuevo == null || String(nuevo).trim() === '') return anterior ?? null;
  return String(nuevo).trim();
}

/** Conserva las columnas de la planilla que no mapean a un campo conocido. */
function buildExtra(
  raw: Record<string, unknown>,
  mapping: Record<string, CanonicalField | null>,
  anterior: Record<string, string | number> | undefined,
): Record<string, string | number> {
  const extra: Record<string, string | number> = { ...(anterior ?? {}) };
  for (const [header, field] of Object.entries(mapping)) {
    if (field) continue;
    const value = raw[header];
    if (value == null || String(value).trim() === '') continue;
    if (header === '__proto__' || header === 'constructor' || header === 'prototype') continue;
    extra[header] = typeof value === 'number' ? value : String(value).trim();
  }
  return extra;
}

/** Aplica la vista previa al stock, devolviendo la nueva lista de unidades. */
export function applyPreview(params: {
  preview: ImportPreview;
  projectId: string;
  unidadesActuales: Unit[];
  /** Qué hacer con las unidades del stock que no vienen en la planilla. */
  accionAusentes: 'conservar' | 'bloquear' | 'eliminar';
}): Unit[] {
  const { preview, projectId, unidadesActuales, accionAusentes } = params;

  const idsAusentes = new Set(preview.ausentes.map((u) => u.id));
  const aplicables = preview.rows.filter((r) => r.resultante != null && r.kind !== 'invalida');
  const porId = new Map(aplicables.map((r) => [r.resultante!.id, r.resultante!]));

  const resultado: Unit[] = [];
  for (const unit of unidadesActuales) {
    if (unit.projectId !== projectId) {
      resultado.push(unit);
      continue;
    }
    const actualizada = porId.get(unit.id);
    if (actualizada) {
      resultado.push(actualizada);
      porId.delete(unit.id);
      continue;
    }
    if (idsAusentes.has(unit.id)) {
      if (accionAusentes === 'eliminar') continue;
      if (accionAusentes === 'bloquear') {
        resultado.push({ ...unit, estado: 'BLOQUEADA', updatedAt: new Date().toISOString() });
        continue;
      }
    }
    resultado.push(unit);
  }
  // Unidades nuevas.
  for (const nueva of porId.values()) resultado.push(nueva);

  return resultado;
}
