/**
 * Genera una planilla de stock sintética para las pruebas end-to-end.
 *
 * Reproduce a propósito las rarezas de una planilla comercial real: filas de
 * título antes del encabezado, números en formato chileno, porcentajes con
 * símbolo, estados escritos de varias maneras y una columna extra que el
 * sistema no debe descartar.
 *
 *   node e2e/make-fixture.mjs [ruta-de-salida]
 */
import * as XLSX from 'xlsx';

const salida = process.argv[2] ?? 'e2e/stock-prueba.xlsx';

const aoa = [
  ['STOCK COMERCIAL — PLANILLA DE PRUEBA'],
  [],
  [
    'Depto', 'Piso', 'Modelo', 'Tipología', 'Dorm', 'Baños', 'Orientación',
    'Sup. Útil (m²)', 'Terraza', 'Precio Lista UF', 'Descuento',
    'Precio con Descuento', 'Estado', 'Bodega',
  ],
];

const orientaciones = ['Norte', 'Nororiente', 'Poniente', 'Sur'];
const tipos = [
  ['Estudio', 0, 1, 28.5, 4.2],
  ['1D+1B', 1, 1, 36.0, 5.5],
  ['2D+2B', 2, 2, 54.3, 7.8],
];

let n = 0;
for (let piso = 3; piso <= 12; piso++) {
  for (let i = 0; i < 4; i++) {
    const t = tipos[i % 3];
    const depto = String(piso * 100 + i + 1);
    const lista = Math.round((2200 + t[3] * 38 + piso * 12) * 100) / 100;
    const dcto = n % 4 === 0 ? 5 : n % 4 === 1 ? 8 : 0;
    const final = Math.round(lista * (1 - dcto / 100) * 100) / 100;
    const estado =
      n % 11 === 0 ? 'Vendido' : n % 13 === 0 ? 'Reservada' : n % 17 === 0 ? 'Bloqueado' : 'Disponible';
    aoa.push([
      depto, piso, `M${(i % 3) + 1}`, t[0], t[1], t[2], orientaciones[i % 4], t[3], t[4],
      lista.toLocaleString('es-CL', { minimumFractionDigits: 2 }),
      dcto ? `${dcto}%` : '',
      final.toLocaleString('es-CL', { minimumFractionDigits: 2 }),
      estado,
      `B-${depto}`,
    ]);
    n++;
  }
}

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Stock');
XLSX.writeFile(wb, salida);
console.log(`${salida} — ${aoa.length - 3} unidades`);
