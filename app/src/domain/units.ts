import type { Unit, UnitStatus } from './types';
import { pricingFromUnit } from './finance';

/**
 * Normaliza el texto de estado de la planilla a los estados del sistema.
 * Se conserva siempre el texto original en `estadoOriginal` para trazabilidad.
 */
export function normalizeStatus(raw: unknown): { estado: UnitStatus; original: string | null } {
  if (raw == null || raw === '') return { estado: 'DESCONOCIDO', original: null };
  const original = String(raw).trim();
  const t = original
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Se usan prefijos (sin \b final) para cubrir género y número: VENDIDO/VENDIDA/VENDIDAS.
  if (/(^|[^A-Z])(VENDID|VENTA CERRAD|ESCRITURAD|PROMESAD)/.test(t) || t === 'V') {
    return { estado: 'VENDIDA', original };
  }
  if (/(^|[^A-Z])(RESERVAD|RESERVA|SEPARAD)/.test(t) || t === 'R') {
    return { estado: 'RESERVADA', original };
  }
  if (
    /(^|[^A-Z])(BLOQUEAD|BLOQUEO|NO DISPONIBLE|RETENID|CONGELAD|NO VENDIBLE)/.test(t) ||
    t === 'B'
  ) {
    return { estado: 'BLOQUEADA', original };
  }
  if (/(^|[^A-Z])(DISPONIBLE|LIBRE|STOCK|EN VENTA|VENTA|ACTIV)/.test(t) || t === 'D' || t === 'SI') {
    return { estado: 'DISPONIBLE', original };
  }

  return { estado: 'DESCONOCIDO', original };
}

/** Sólo las unidades DISPONIBLE pueden cotizarse. */
export function isCotizable(unit: Unit): boolean {
  return unit.estado === 'DISPONIBLE' && pricingFromUnit(unit).precioConDescuentoUF != null;
}

export function statusLabel(estado: UnitStatus): string {
  return estado === 'DESCONOCIDO' ? 'SIN ESTADO' : estado;
}

/**
 * Clave estable de una unidad dentro de un proyecto. Se usa para reconciliar
 * la planilla con el stock existente en cada importación.
 */
export function unitKey(projectId: string, departamento: string): string {
  return `${projectId}::${departamento.trim().toUpperCase()}`;
}

/** Deriva una etiqueta de tipología legible cuando la planilla no la trae. */
export function tipologiaLabel(unit: Unit): string | null {
  if (unit.tipologia) return unit.tipologia;
  if (unit.dormitorios == null && unit.banos == null) return null;
  if (unit.dormitorios === 0) return 'Estudio';
  const d = unit.dormitorios != null ? `${unit.dormitorios}D` : '';
  const b = unit.banos != null ? `${unit.banos}B` : '';
  return `${d}${b}` || null;
}

/** Superficie total: usa la de la planilla, o suma útil + terraza si falta. */
export function superficieTotal(unit: Unit): number | null {
  if (unit.superficieTotal != null) return unit.superficieTotal;
  if (unit.superficieUtil == null && unit.superficieTerraza == null) return null;
  return (unit.superficieUtil ?? 0) + (unit.superficieTerraza ?? 0);
}

export function emptyUnit(projectId: string, departamento: string): Unit {
  return {
    id: crypto.randomUUID(),
    projectId,
    departamento,
    piso: null,
    modelo: null,
    tipologia: null,
    dormitorios: null,
    banos: null,
    orientacion: null,
    superficieUtil: null,
    superficieTerraza: null,
    superficieTotal: null,
    precioListaUF: null,
    descuentoPct: null,
    descuentoMontoUF: null,
    precioConDescuentoUF: null,
    estado: 'DESCONOCIDO',
    estadoOriginal: null,
    bonoPiePct: null,
    extra: {},
    source: 'manual',
    updatedAt: new Date().toISOString(),
  };
}
