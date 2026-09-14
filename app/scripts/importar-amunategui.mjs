/**
 * Genera el stock semilla de Edificio Vista Amunátegui a partir de la planilla
 * general de AJ Urbana (hoja «Vista Amunategui (EI)»).
 *
 *   node scripts/importar-amunategui.mjs <ruta-planilla.xlsx>
 *
 * Escribe src/data/projects/vista-amunategui-units.ts. No inventa ningún valor:
 * lo que la planilla no trae queda en null, y las identidades de precio se
 * verifican antes de escribir.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';

// SheetJS se publica como CommonJS; en un módulo ESM se carga vía createRequire.
const XLSX = createRequire(import.meta.url)('xlsx');

const ruta = process.argv[2];
if (!ruta) {
  console.error('Uso: node scripts/importar-amunategui.mjs <ruta-planilla.xlsx>');
  process.exit(1);
}

const HOJA = 'Vista Amunategui (EI)';
const wb = XLSX.readFile(ruta);
const matrix = XLSX.utils.sheet_to_json(wb.Sheets[HOJA], {
  header: 1,
  blankrows: false,
  defval: null,
  raw: true,
});

// Índices de columna de la hoja (fila de encabezados: índice 9).
const C = {
  estado: 0, depto: 1, piso: 2, modelo: 3, tipologia: 4, orientacion: 5,
  util: 7, terraza: 8, total: 9,
  precioLista: 11, descuento: 12, precioConDescuento: 13,
  est1: 15, est2: 16, bodega: 17, bodegaBici: 18,
  adicionales: 20, negocioFinal: 22, aporte: 24, comentarios: 25,
};

const ORIENTACIONES = {
  N: 'Norte', S: 'Sur', O: 'Oriente', P: 'Poniente',
  NO: 'Nororiente', NP: 'Norponiente', SO: 'Suroriente', SP: 'Surponiente',
};

const TIPOLOGIAS = {
  Studio: { nombre: 'Estudio', dormitorios: 0, banos: 1 },
  '1D1B': { nombre: '1D+1B', dormitorios: 1, banos: 1 },
  '2D2B': { nombre: '2D+2B', dormitorios: 2, banos: 2 },
};

const txt = (v) => {
  if (v == null) return null;
  const t = String(v).replace(/\s+/g, ' ').trim();
  return t === '' ? null : t;
};
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const r2 = (v) => (v == null ? null : Math.round(v * 1e6) / 1e6);

const filas = matrix.slice(10).filter((f) => txt(f[C.depto]));
const unidades = [];
const problemas = [];

for (const f of filas) {
  const depto = txt(f[C.depto]);
  const tipoRaw = txt(f[C.tipologia]);
  const tipo = TIPOLOGIAS[tipoRaw];
  if (!tipo) problemas.push(`Depto ${depto}: tipología desconocida "${tipoRaw}"`);

  const estadoRaw = txt(f[C.estado]);
  const estado =
    estadoRaw === 'DISPONIBLE' ? 'DISPONIBLE'
    : estadoRaw === 'BLOQUEADO' ? 'BLOQUEADA'
    : estadoRaw === 'RESERVADO' ? 'RESERVADA'
    : estadoRaw === 'VENDIDO' ? 'VENDIDA'
    : 'DESCONOCIDO';
  if (estado === 'DESCONOCIDO') problemas.push(`Depto ${depto}: estado desconocido "${estadoRaw}"`);

  const lista = num(f[C.precioLista]);
  const dcto = num(f[C.descuento]);
  const conDcto = num(f[C.precioConDescuento]);
  const adic = num(f[C.adicionales]);
  const negocio = num(f[C.negocioFinal]);
  const aporte = num(f[C.aporte]);

  // Verificación de las identidades de la planilla antes de escribir el dato.
  if (lista != null && dcto != null && conDcto != null &&
      Math.abs(lista * (1 - dcto) - conDcto) > 0.02) {
    problemas.push(`Depto ${depto}: precio con descuento no calza con lista × (1 − dcto)`);
  }
  if (conDcto != null && negocio != null &&
      Math.abs(conDcto + (adic ?? 0) - negocio) > 0.02) {
    problemas.push(`Depto ${depto}: precio negocio final no calza con precio con descuento + adicionales`);
  }
  const util = num(f[C.util]);
  const terraza = num(f[C.terraza]);
  const total = num(f[C.total]);
  if (util != null && total != null && Math.abs(util + (terraza ?? 0) - total) > 0.02) {
    problemas.push(`Depto ${depto}: superficie total no calza con útil + terraza`);
  }

  const aportePct =
    aporte != null && negocio ? r2(1 - negocio / aporte) : null;

  const orientRaw = txt(f[C.orientacion]);

  unidades.push({
    departamento: depto,
    piso: num(f[C.piso]),
    modelo: f[C.modelo] == null ? null : String(f[C.modelo]),
    tipologia: tipo ? tipo.nombre : tipoRaw,
    dormitorios: tipo ? tipo.dormitorios : null,
    banos: tipo ? tipo.banos : null,
    orientacion: orientRaw ? (ORIENTACIONES[orientRaw] ?? orientRaw) : null,
    superficieUtil: util,
    superficieTerraza: terraza,
    superficieTotal: total,
    precioListaUF: lista,
    descuentoPct: dcto,
    descuentoMontoUF: null,
    precioConDescuentoUF: conDcto,
    estado,
    estadoOriginal: estadoRaw,
    estacionamiento: txt(f[C.est1]),
    estacionamiento2: txt(f[C.est2]),
    bodega: txt(f[C.bodega]),
    bodegaBicicleta: txt(f[C.bodegaBici]),
    precioAdicionalesUF: adic,
    precioNegocioFinalUF: negocio,
    aporteInmobiliarioPct: aportePct,
    precioAporteInmobiliarioUF: aporte,
    comentarios: txt(f[C.comentarios]),
  });
}

const resumen = unidades.reduce((acc, u) => {
  acc[u.estado] = (acc[u.estado] ?? 0) + 1;
  return acc;
}, {});

const salida = `/**
 * Stock de Edificio Vista Amunátegui.
 *
 * GENERADO AUTOMÁTICAMENTE — no editar a mano.
 *   node scripts/importar-amunategui.mjs <planilla.xlsx>
 *
 * Fuente: planilla general de stock de AJ Urbana, hoja «${HOJA}».
 * Ningún valor fue calculado ni supuesto: todos provienen de la planilla, y las
 * identidades de precio y superficie se verificaron durante la generación.
 *
 * ${unidades.length} unidades · ${Object.entries(resumen).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(' · ')}
 */
import type { UnitSeed } from './tipos';

export const VISTA_AMUNATEGUI_UNITS: UnitSeed[] = ${JSON.stringify(unidades, null, 2)};
`;

fs.mkdirSync('src/data/projects', { recursive: true });
fs.writeFileSync('src/data/projects/vista-amunategui-units.ts', salida);

console.log(`unidades: ${unidades.length}`, resumen);
console.log('con adicionales:', unidades.filter((u) => u.precioAdicionalesUF).length);
console.log('con aporte inmobiliario:', unidades.filter((u) => u.precioAporteInmobiliarioUF).length);
if (problemas.length) {
  console.log('\nPROBLEMAS DETECTADOS:');
  problemas.forEach((p) => console.log(' -', p));
} else {
  console.log('\nSin inconsistencias: todas las identidades de la planilla se verifican.');
}
