import { pricingFromUnit } from './finance';
import { superficieTotal, tipologiaLabel } from './units';
import type { Project, Unit, UnitStatus } from './types';

export interface UnitFilter {
  texto: string;
  projectIds: string[];
  comunas: string[];
  tipologias: string[];
  dormitorios: number[];
  banos: number[];
  orientaciones: string[];
  pisos: number[];
  estados: UnitStatus[];
  precioMinUF: number | null;
  precioMaxUF: number | null;
  superficieMin: number | null;
  superficieMax: number | null;
  soloCotizables: boolean;
}

export function emptyFilter(): UnitFilter {
  return {
    texto: '',
    projectIds: [],
    comunas: [],
    tipologias: [],
    dormitorios: [],
    banos: [],
    orientaciones: [],
    pisos: [],
    estados: [],
    precioMinUF: null,
    precioMaxUF: null,
    superficieMin: null,
    superficieMax: null,
    soloCotizables: false,
  };
}

export function filterIsEmpty(f: UnitFilter): boolean {
  const base = emptyFilter();
  return JSON.stringify({ ...f, texto: f.texto.trim() }) === JSON.stringify(base);
}

export function countActiveFilters(f: UnitFilter): number {
  let n = 0;
  if (f.texto.trim()) n++;
  n += f.projectIds.length ? 1 : 0;
  n += f.comunas.length ? 1 : 0;
  n += f.tipologias.length ? 1 : 0;
  n += f.dormitorios.length ? 1 : 0;
  n += f.banos.length ? 1 : 0;
  n += f.orientaciones.length ? 1 : 0;
  n += f.pisos.length ? 1 : 0;
  n += f.estados.length ? 1 : 0;
  if (f.precioMinUF != null || f.precioMaxUF != null) n++;
  if (f.superficieMin != null || f.superficieMax != null) n++;
  if (f.soloCotizables) n++;
  return n;
}

function matchTexto(unit: Unit, project: Project | undefined, texto: string): boolean {
  const t = texto.trim().toLowerCase();
  if (!t) return true;
  const campos = [
    unit.departamento,
    unit.modelo,
    unit.tipologia,
    unit.orientacion,
    project?.nombre,
    project?.comuna,
    project?.direccion,
    project?.inmobiliaria,
  ];
  return campos.some((c) => c && String(c).toLowerCase().includes(t));
}

export function matchesUnit(
  unit: Unit,
  filter: UnitFilter,
  project: Project | undefined,
): boolean {
  if (!matchTexto(unit, project, filter.texto)) return false;
  if (filter.projectIds.length && !filter.projectIds.includes(unit.projectId)) return false;
  if (filter.comunas.length && !filter.comunas.includes(project?.comuna ?? '')) return false;

  if (filter.tipologias.length) {
    const tipo = tipologiaLabel(unit);
    if (!tipo || !filter.tipologias.includes(tipo)) return false;
  }
  if (filter.dormitorios.length && (unit.dormitorios == null || !filter.dormitorios.includes(unit.dormitorios)))
    return false;
  if (filter.banos.length && (unit.banos == null || !filter.banos.includes(unit.banos))) return false;
  if (filter.orientaciones.length && (!unit.orientacion || !filter.orientaciones.includes(unit.orientacion)))
    return false;
  if (filter.pisos.length && (unit.piso == null || !filter.pisos.includes(unit.piso))) return false;
  if (filter.estados.length && !filter.estados.includes(unit.estado)) return false;

  const precio = pricingFromUnit(unit).precioConDescuentoUF;
  if (filter.precioMinUF != null && (precio == null || precio < filter.precioMinUF)) return false;
  if (filter.precioMaxUF != null && (precio == null || precio > filter.precioMaxUF)) return false;

  const sup = superficieTotal(unit);
  if (filter.superficieMin != null && (sup == null || sup < filter.superficieMin)) return false;
  if (filter.superficieMax != null && (sup == null || sup > filter.superficieMax)) return false;

  if (filter.soloCotizables && (unit.estado !== 'DISPONIBLE' || precio == null)) return false;

  return true;
}

/** Opciones disponibles para poblar los selectores de filtro. */
export interface FilterOptions {
  proyectos: { id: string; nombre: string }[];
  comunas: string[];
  tipologias: string[];
  dormitorios: number[];
  banos: number[];
  orientaciones: string[];
  pisos: number[];
  estados: UnitStatus[];
  precioMinUF: number | null;
  precioMaxUF: number | null;
  superficieMin: number | null;
  superficieMax: number | null;
}

export function buildFilterOptions(units: Unit[], projects: Project[]): FilterOptions {
  const byId = new Map(projects.map((p) => [p.id, p]));
  const tipologias = new Set<string>();
  const dormitorios = new Set<number>();
  const banos = new Set<number>();
  const orientaciones = new Set<string>();
  const pisos = new Set<number>();
  const estados = new Set<UnitStatus>();
  const comunas = new Set<string>();
  let precioMin: number | null = null;
  let precioMax: number | null = null;
  let supMin: number | null = null;
  let supMax: number | null = null;

  for (const u of units) {
    const tipo = tipologiaLabel(u);
    if (tipo) tipologias.add(tipo);
    if (u.dormitorios != null) dormitorios.add(u.dormitorios);
    if (u.banos != null) banos.add(u.banos);
    if (u.orientacion) orientaciones.add(u.orientacion);
    if (u.piso != null) pisos.add(u.piso);
    estados.add(u.estado);
    const comuna = byId.get(u.projectId)?.comuna;
    if (comuna) comunas.add(comuna);

    const precio = pricingFromUnit(u).precioConDescuentoUF;
    if (precio != null) {
      precioMin = precioMin == null ? precio : Math.min(precioMin, precio);
      precioMax = precioMax == null ? precio : Math.max(precioMax, precio);
    }
    const sup = superficieTotal(u);
    if (sup != null) {
      supMin = supMin == null ? sup : Math.min(supMin, sup);
      supMax = supMax == null ? sup : Math.max(supMax, sup);
    }
  }

  for (const p of projects) if (p.comuna) comunas.add(p.comuna);

  return {
    proyectos: projects.map((p) => ({ id: p.id, nombre: p.nombre })),
    comunas: [...comunas].sort((a, b) => a.localeCompare(b, 'es')),
    tipologias: [...tipologias].sort((a, b) => a.localeCompare(b, 'es')),
    dormitorios: [...dormitorios].sort((a, b) => a - b),
    banos: [...banos].sort((a, b) => a - b),
    orientaciones: [...orientaciones].sort((a, b) => a.localeCompare(b, 'es')),
    pisos: [...pisos].sort((a, b) => a - b),
    estados: [...estados],
    precioMinUF: precioMin,
    precioMaxUF: precioMax,
    superficieMin: supMin,
    superficieMax: supMax,
  };
}

export interface ProjectStats {
  total: number;
  disponibles: number;
  cotizables: number;
  precioDesdeUF: number | null;
  precioHastaUF: number | null;
  superficieDesde: number | null;
  tipologias: string[];
  porEstado: Record<UnitStatus, number>;
}

export function projectStats(units: Unit[]): ProjectStats {
  const porEstado: Record<UnitStatus, number> = {
    DISPONIBLE: 0,
    BLOQUEADA: 0,
    RESERVADA: 0,
    VENDIDA: 0,
    DESCONOCIDO: 0,
  };
  let precioDesde: number | null = null;
  let precioHasta: number | null = null;
  let supDesde: number | null = null;
  let cotizables = 0;
  const tipologias = new Set<string>();

  for (const u of units) {
    porEstado[u.estado]++;
    const tipo = tipologiaLabel(u);
    if (tipo) tipologias.add(tipo);
    const precio = pricingFromUnit(u).precioConDescuentoUF;
    if (u.estado === 'DISPONIBLE' && precio != null) {
      cotizables++;
      precioDesde = precioDesde == null ? precio : Math.min(precioDesde, precio);
      precioHasta = precioHasta == null ? precio : Math.max(precioHasta, precio);
      const sup = superficieTotal(u);
      if (sup != null) supDesde = supDesde == null ? sup : Math.min(supDesde, sup);
    }
  }

  return {
    total: units.length,
    disponibles: porEstado.DISPONIBLE,
    cotizables,
    precioDesdeUF: precioDesde,
    precioHastaUF: precioHasta,
    superficieDesde: supDesde,
    tipologias: [...tipologias].sort((a, b) => a.localeCompare(b, 'es')),
    porEstado,
  };
}
