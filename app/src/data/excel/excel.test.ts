import { describe, expect, it } from 'vitest';
import { coerceNumber, coercePercent, coerceText, type SheetData } from './parse';
import { autoMap, normalizeHeader } from './mapping';
import { applyPreview, buildPreview } from './diff';
import { normalizeStatus } from '../../domain/units';
import type { Unit } from '../../domain/types';

describe('coerceNumber — formatos de planilla', () => {
  it('acepta números tal cual', () => {
    expect(coerceNumber(2345.67)).toBe(2345.67);
  });
  it('interpreta el formato chileno con miles y decimales', () => {
    expect(coerceNumber('2.345,67')).toBeCloseTo(2345.67, 6);
  });
  it('interpreta el formato anglosajón', () => {
    expect(coerceNumber('2,345.67')).toBeCloseTo(2345.67, 6);
  });
  it('trata el punto de miles sin decimales como separador de miles', () => {
    expect(coerceNumber('3.450')).toBe(3450);
  });
  it('trata una coma decimal simple como decimal', () => {
    expect(coerceNumber('3,45')).toBeCloseTo(3.45, 6);
  });
  it('limpia prefijos de moneda y unidades', () => {
    expect(coerceNumber('UF 2.345,67')).toBeCloseTo(2345.67, 6);
    expect(coerceNumber('$ 1.234')).toBe(1234);
    expect(coerceNumber('45,5 m²')).toBeCloseTo(45.5, 6);
  });
  it('interpreta paréntesis como negativo', () => {
    expect(coerceNumber('(150)')).toBe(-150);
  });
  it('devuelve null para celdas vacías o guiones', () => {
    expect(coerceNumber('')).toBeNull();
    expect(coerceNumber(null)).toBeNull();
    expect(coerceNumber('-')).toBeNull();
    expect(coerceNumber('N/A')).toBeNull();
  });
});

describe('coercePercent', () => {
  it('convierte 5 en 0,05', () => expect(coercePercent(5)).toBeCloseTo(0.05, 10));
  it('conserva 0,05 como 0,05', () => expect(coercePercent(0.05)).toBeCloseTo(0.05, 10));
  it('convierte "5%" en 0,05', () => expect(coercePercent('5%')).toBeCloseTo(0.05, 10));
  it('convierte "0,5%" en 0,005', () => expect(coercePercent('0,5%')).toBeCloseTo(0.005, 10));
  it('convierte "12,5" en 0,125', () => expect(coercePercent('12,5')).toBeCloseTo(0.125, 10));
  it('devuelve null si está vacío', () => expect(coercePercent(null)).toBeNull());
});

describe('coerceText', () => {
  it('recorta y normaliza vacíos', () => {
    expect(coerceText('  Norponiente ')).toBe('Norponiente');
    expect(coerceText('   ')).toBeNull();
  });
});

describe('normalizeStatus', () => {
  it('reconoce los estados del sistema con y sin tildes', () => {
    expect(normalizeStatus('Disponible').estado).toBe('DISPONIBLE');
    expect(normalizeStatus('VENDIDO').estado).toBe('VENDIDA');
    expect(normalizeStatus('Reservada').estado).toBe('RESERVADA');
    expect(normalizeStatus('Bloqueado').estado).toBe('BLOQUEADA');
    expect(normalizeStatus('No disponible').estado).toBe('BLOQUEADA');
  });
  it('conserva el texto original de la planilla', () => {
    expect(normalizeStatus(' En Venta ').original).toBe('En Venta');
  });
  it('marca como DESCONOCIDO lo que no reconoce, sin inventar', () => {
    expect(normalizeStatus('xyz').estado).toBe('DESCONOCIDO');
    expect(normalizeStatus(null).estado).toBe('DESCONOCIDO');
  });
});

describe('autoMap', () => {
  it('normaliza encabezados con tildes y símbolos', () => {
    expect(normalizeHeader('Superficie Útil (m²)')).toBe('superficie util m2');
  });

  it('mapea automáticamente los encabezados habituales', () => {
    const m = autoMap([
      'Depto',
      'Piso',
      'Tipología',
      'Orientación',
      'Sup. Útil',
      'Terraza',
      'Precio Lista UF',
      'Descuento',
      'Precio con Descuento',
      'Estado',
    ]);
    expect(m['Depto']).toBe('departamento');
    expect(m['Piso']).toBe('piso');
    expect(m['Tipología']).toBe('tipologia');
    expect(m['Orientación']).toBe('orientacion');
    expect(m['Sup. Útil']).toBe('superficieUtil');
    expect(m['Terraza']).toBe('superficieTerraza');
    expect(m['Precio Lista UF']).toBe('precioListaUF');
    expect(m['Descuento']).toBe('descuentoPct');
    expect(m['Precio con Descuento']).toBe('precioConDescuentoUF');
    expect(m['Estado']).toBe('estado');
  });

  it('no asigna dos veces el mismo campo', () => {
    const m = autoMap(['Departamento', 'Depto']);
    const asignados = Object.values(m).filter((v) => v === 'departamento');
    expect(asignados).toHaveLength(1);
  });

  it('deja en null lo que no reconoce, para mapeo manual', () => {
    const m = autoMap(['Bodega asignada', 'Depto']);
    expect(m['Bodega asignada']).toBeNull();
  });
});

/* ── Diff de importación ─────────────────────────────────────────────────── */

const sheet = (rows: Record<string, unknown>[]): SheetData => ({
  nombre: 'Stock',
  headers: ['Depto', 'Piso', 'Precio Lista UF', 'Precio con Descuento', 'Estado', 'Bodega'],
  rows,
});

const mapping = autoMap(sheet([]).headers);

const unidadExistente = (over: Partial<Unit> = {}): Unit => ({
  id: 'u-1',
  projectId: 'p1',
  departamento: '301',
  piso: 3,
  modelo: null,
  tipologia: null,
  dormitorios: null,
  banos: null,
  orientacion: null,
  superficieUtil: null,
  superficieTerraza: null,
  superficieTotal: null,
  precioListaUF: 3000,
  descuentoPct: null,
  descuentoMontoUF: null,
  precioConDescuentoUF: 2850,
  estado: 'DISPONIBLE',
  estadoOriginal: 'Disponible',
  bonoPiePct: 0.05,
  extra: {},
  source: 'excel',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('buildPreview', () => {
  it('clasifica nuevas, actualizadas, cambios de estado y sin cambios', () => {
    const preview = buildPreview({
      sheet: sheet([
        { Depto: '301', Piso: 3, 'Precio Lista UF': 3000, 'Precio con Descuento': 2850, Estado: 'Disponible' },
        { Depto: '302', Piso: 3, 'Precio Lista UF': 3100, 'Precio con Descuento': 2900, Estado: 'Disponible' },
        { Depto: '303', Piso: 3, 'Precio Lista UF': 3200, 'Precio con Descuento': 3000, Estado: 'Vendido' },
      ]),
      mapping,
      projectId: 'p1',
      unidadesActuales: [
        unidadExistente(),
        unidadExistente({ id: 'u-2', departamento: '302', precioConDescuentoUF: 2800 }),
        unidadExistente({ id: 'u-3', departamento: '303', precioListaUF: 3200, precioConDescuentoUF: 3000 }),
      ],
    });
    expect(preview.totalFilas).toBe(3);
    expect(preview.sinCambios).toBe(1);
    expect(preview.actualizadas).toBe(1);
    expect(preview.cambiosDeEstado).toBe(1);
    expect(preview.nuevas).toBe(0);
  });

  it('detecta unidades nuevas', () => {
    const preview = buildPreview({
      sheet: sheet([
        { Depto: '401', 'Precio Lista UF': 3500, Estado: 'Disponible' },
      ]),
      mapping,
      projectId: 'p1',
      unidadesActuales: [],
    });
    expect(preview.nuevas).toBe(1);
    expect(preview.rows[0].resultante!.precioListaUF).toBe(3500);
  });

  it('lista las unidades del stock ausentes en la planilla', () => {
    const preview = buildPreview({
      sheet: sheet([{ Depto: '301', 'Precio Lista UF': 3000, Estado: 'Disponible' }]),
      mapping,
      projectId: 'p1',
      unidadesActuales: [unidadExistente(), unidadExistente({ id: 'u-9', departamento: '999' })],
    });
    expect(preview.ausentes.map((u) => u.departamento)).toEqual(['999']);
  });

  it('conserva los datos comerciales que no vienen de la planilla', () => {
    const preview = buildPreview({
      sheet: sheet([{ Depto: '301', 'Precio Lista UF': 3050, Estado: 'Disponible' }]),
      mapping,
      projectId: 'p1',
      unidadesActuales: [unidadExistente({ bonoPiePct: 0.07 })],
    });
    expect(preview.rows[0].resultante!.bonoPiePct).toBe(0.07);
  });

  it('preserva las columnas no mapeadas en `extra`', () => {
    const preview = buildPreview({
      sheet: sheet([{ Depto: '301', 'Precio Lista UF': 3000, Bodega: 'B-12', Estado: 'Disponible' }]),
      mapping,
      projectId: 'p1',
      unidadesActuales: [],
    });
    expect(preview.rows[0].resultante!.extra['Bodega']).toBe('B-12');
    expect(preview.columnasNoMapeadas).toContain('Bodega');
  });

  it('marca filas sin departamento como inválidas', () => {
    const preview = buildPreview({
      sheet: sheet([{ Depto: null, 'Precio Lista UF': 3000 }]),
      mapping,
      projectId: 'p1',
      unidadesActuales: [],
    });
    expect(preview.invalidas).toBe(1);
    expect(preview.rows[0].errores[0]).toMatch(/sin identificador/);
  });

  it('detecta departamentos duplicados dentro de la planilla', () => {
    const preview = buildPreview({
      sheet: sheet([
        { Depto: '301', 'Precio Lista UF': 3000, Estado: 'Disponible' },
        { Depto: '301', 'Precio Lista UF': 3100, Estado: 'Disponible' },
      ]),
      mapping,
      projectId: 'p1',
      unidadesActuales: [],
    });
    expect(preview.rows[1].errores.join(' ')).toMatch(/duplicado/);
  });

  it('advierte cuando una fila no trae precio', () => {
    const preview = buildPreview({
      sheet: sheet([{ Depto: '301', Estado: 'Disponible' }]),
      mapping,
      projectId: 'p1',
      unidadesActuales: [],
    });
    expect(preview.rows[0].errores.join(' ')).toMatch(/sin precio/);
  });

  it('filtra por proyecto cuando la planilla trae varios', () => {
    const s: SheetData = {
      nombre: 'Stock',
      headers: ['Proyecto', 'Depto', 'Precio Lista UF', 'Estado'],
      rows: [
        { Proyecto: 'Vista Amunátegui', Depto: '301', 'Precio Lista UF': 3000, Estado: 'Disponible' },
        { Proyecto: 'Otro Edificio', Depto: '101', 'Precio Lista UF': 2000, Estado: 'Disponible' },
      ],
    };
    const preview = buildPreview({
      sheet: s,
      mapping: autoMap(s.headers),
      projectId: 'p1',
      unidadesActuales: [],
      filtroProyecto: 'Vista Amunátegui',
    });
    expect(preview.totalFilas).toBe(1);
    expect(preview.rows[0].departamento).toBe('301');
  });
});

describe('applyPreview', () => {
  const preview = () =>
    buildPreview({
      sheet: sheet([
        { Depto: '301', 'Precio Lista UF': 3050, Estado: 'Disponible' },
        { Depto: '401', 'Precio Lista UF': 3500, Estado: 'Disponible' },
      ]),
      mapping,
      projectId: 'p1',
      unidadesActuales: [unidadExistente(), unidadExistente({ id: 'u-9', departamento: '999' })],
    });

  it('actualiza existentes y agrega nuevas conservando el id', () => {
    const units = applyPreview({
      preview: preview(),
      projectId: 'p1',
      unidadesActuales: [unidadExistente(), unidadExistente({ id: 'u-9', departamento: '999' })],
      accionAusentes: 'conservar',
    });
    expect(units).toHaveLength(3);
    expect(units.find((u) => u.departamento === '301')!.id).toBe('u-1');
    expect(units.find((u) => u.departamento === '301')!.precioListaUF).toBe(3050);
    expect(units.find((u) => u.departamento === '401')).toBeTruthy();
    expect(units.find((u) => u.departamento === '999')).toBeTruthy();
  });

  it('puede bloquear las unidades ausentes', () => {
    const units = applyPreview({
      preview: preview(),
      projectId: 'p1',
      unidadesActuales: [unidadExistente(), unidadExistente({ id: 'u-9', departamento: '999' })],
      accionAusentes: 'bloquear',
    });
    expect(units.find((u) => u.departamento === '999')!.estado).toBe('BLOQUEADA');
  });

  it('puede eliminar las unidades ausentes', () => {
    const units = applyPreview({
      preview: preview(),
      projectId: 'p1',
      unidadesActuales: [unidadExistente(), unidadExistente({ id: 'u-9', departamento: '999' })],
      accionAusentes: 'eliminar',
    });
    expect(units.find((u) => u.departamento === '999')).toBeUndefined();
  });

  it('no toca las unidades de otros proyectos', () => {
    const otra = unidadExistente({ id: 'x', projectId: 'p2', departamento: '301' });
    const units = applyPreview({
      preview: preview(),
      projectId: 'p1',
      unidadesActuales: [unidadExistente(), otra],
      accionAusentes: 'eliminar',
    });
    expect(units.find((u) => u.id === 'x')).toBeTruthy();
  });
});
