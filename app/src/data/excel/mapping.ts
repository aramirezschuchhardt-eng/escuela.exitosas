/**
 * Mapeo de columnas de la planilla a los campos del sistema.
 *
 * Las planillas de stock no tienen un formato estándar: cada inmobiliaria usa
 * sus propios encabezados. Aquí se define, para cada campo canónico, la lista de
 * encabezados que se reconocen automáticamente. El administrador siempre puede
 * corregir el mapeo a mano antes de confirmar la importación.
 */

export type CanonicalField =
  | 'departamento'
  | 'piso'
  | 'modelo'
  | 'tipologia'
  | 'dormitorios'
  | 'banos'
  | 'orientacion'
  | 'superficieUtil'
  | 'superficieTerraza'
  | 'superficieTotal'
  | 'precioListaUF'
  | 'descuentoPct'
  | 'descuentoMontoUF'
  | 'precioConDescuentoUF'
  | 'estado'
  | 'proyecto';

export interface FieldSpec {
  field: CanonicalField;
  label: string;
  type: 'text' | 'number' | 'percent' | 'status';
  aliases: string[];
  requerido?: boolean;
  ayuda?: string;
}

/** Normaliza un encabezado para comparar: sin tildes, sin signos, minúsculas. */
export function normalizeHeader(header: string): string {
  return String(header)
    .replace(/\u00b2/g, '2')
    .replace(/\u00b3/g, '3')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const FIELD_SPECS: FieldSpec[] = [
  {
    field: 'proyecto',
    label: 'Proyecto',
    type: 'text',
    aliases: ['proyecto', 'edificio', 'condominio', 'nombre proyecto', 'torre'],
    ayuda: 'Si la planilla trae varios proyectos, esta columna los separa.',
  },
  {
    field: 'departamento',
    label: 'Departamento',
    type: 'text',
    requerido: true,
    aliases: [
      'departamento',
      'depto',
      'dpto',
      'depto n',
      'n depto',
      'numero depto',
      'unidad',
      'n unidad',
      'numero',
      'nro',
      'casa',
    ],
    ayuda: 'Identifica la unidad. Es la clave para reconocer si ya existe en el stock.',
  },
  { field: 'piso', label: 'Piso', type: 'number', aliases: ['piso', 'nivel', 'n piso'] },
  {
    field: 'modelo',
    label: 'Modelo',
    type: 'text',
    aliases: ['modelo', 'tipo depto', 'linea'],
  },
  {
    field: 'tipologia',
    label: 'Tipología',
    type: 'text',
    aliases: ['tipologia', 'tipo', 'programa', 'tipologia depto'],
  },
  {
    field: 'dormitorios',
    label: 'Dormitorios',
    type: 'number',
    aliases: ['dormitorios', 'dorm', 'd', 'n dormitorios', 'habitaciones', 'nro dormitorios'],
  },
  {
    field: 'banos',
    label: 'Baños',
    type: 'number',
    aliases: ['banos', 'bano', 'b', 'n banos', 'nro banos'],
  },
  {
    field: 'orientacion',
    label: 'Orientación',
    type: 'text',
    aliases: ['orientacion', 'vista', 'exposicion'],
  },
  {
    field: 'superficieUtil',
    label: 'Superficie útil (m²)',
    type: 'number',
    aliases: [
      'superficie util',
      'sup util',
      'm2 util',
      'util',
      'superficie interior',
      'sup interior',
      'sup util m2',
    ],
  },
  {
    field: 'superficieTerraza',
    label: 'Terraza (m²)',
    type: 'number',
    aliases: ['terraza', 'superficie terraza', 'sup terraza', 'm2 terraza', 'balcon'],
  },
  {
    field: 'superficieTotal',
    label: 'Superficie total (m²)',
    type: 'number',
    aliases: [
      'superficie total',
      'sup total',
      'm2 total',
      'total m2',
      'superficie',
      'sup totales',
    ],
  },
  {
    field: 'precioListaUF',
    label: 'Precio lista (UF)',
    type: 'number',
    requerido: true,
    aliases: [
      'precio lista',
      'precio lista uf',
      'precio uf',
      'valor uf',
      'precio',
      'valor lista',
      'uf lista',
      'precio venta uf',
      'valor departamento',
      'precio total uf',
    ],
  },
  {
    field: 'descuentoPct',
    label: 'Descuento (%)',
    type: 'percent',
    aliases: ['descuento', 'descuento porcentaje', 'dcto', 'dcto', '% descuento', 'descuento %'],
    ayuda: 'Se acepta 5 o 0,05: ambos se interpretan como 5%.',
  },
  {
    field: 'descuentoMontoUF',
    label: 'Descuento (UF)',
    type: 'number',
    aliases: ['descuento uf', 'monto descuento', 'dcto uf', 'descuento monto'],
  },
  {
    field: 'precioConDescuentoUF',
    label: 'Precio con descuento (UF)',
    type: 'number',
    aliases: [
      'precio con descuento',
      'precio con dcto',
      'precio final',
      'precio final uf',
      'valor con descuento',
      'precio neto',
      'precio oferta',
      'uf con descuento',
      'precio descuento uf',
    ],
    ayuda: 'Si esta columna existe, su valor manda por sobre cualquier cálculo.',
  },
  {
    field: 'estado',
    label: 'Estado',
    type: 'status',
    aliases: ['estado', 'status', 'disponibilidad', 'situacion', 'estado unidad', 'condicion'],
  },
];

const ALIAS_INDEX = new Map<string, CanonicalField>();
for (const spec of FIELD_SPECS) {
  for (const alias of spec.aliases) {
    ALIAS_INDEX.set(normalizeHeader(alias), spec.field);
  }
  ALIAS_INDEX.set(normalizeHeader(spec.label), spec.field);
}

/**
 * Propone un mapeo automático encabezado → campo.
 * Devuelve un registro `encabezado original -> campo` (o `null` si no se reconoce).
 */
export function autoMap(headers: string[]): Record<string, CanonicalField | null> {
  const used = new Set<CanonicalField>();
  const result: Record<string, CanonicalField | null> = {};

  // Primera pasada: coincidencia exacta del encabezado normalizado.
  for (const header of headers) {
    const key = normalizeHeader(header);
    const exact = ALIAS_INDEX.get(key);
    if (exact && !used.has(exact)) {
      result[header] = exact;
      used.add(exact);
    } else {
      result[header] = null;
    }
  }

  // Segunda pasada: coincidencia por inclusión, para encabezados con texto extra
  // del tipo "Precio lista UF (al 01-01)".
  for (const header of headers) {
    if (result[header]) continue;
    const key = normalizeHeader(header);
    if (!key) continue;
    let best: { field: CanonicalField; score: number } | null = null;
    for (const [alias, field] of ALIAS_INDEX) {
      if (used.has(field) || alias.length < 3) continue;
      if (key === alias || key.includes(alias)) {
        const score = alias.length;
        if (!best || score > best.score) best = { field, score };
      }
    }
    if (best) {
      result[header] = best.field;
      used.add(best.field);
    }
  }

  return result;
}
