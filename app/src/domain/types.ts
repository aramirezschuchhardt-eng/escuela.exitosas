/**
 * Modelo de dominio del Cotizador Inmobiliario.
 *
 * Convenciones:
 *  - Los montos de propiedad se guardan en UF (unidad de fomento), que es la unidad
 *    en la que vienen las planillas de stock chilenas.
 *  - Los montos mensuales (arriendo, dividendo, cuotas) se presentan en CLP usando
 *    el valor de UF configurado en el panel administrador.
 *  - Los porcentajes se guardan como fracción decimal (0.10 = 10%).
 */

export type UnitStatus =
  | 'DISPONIBLE'
  | 'BLOQUEADA'
  | 'RESERVADA'
  | 'VENDIDA'
  | 'DESCONOCIDO';

export const UNIT_STATUSES: UnitStatus[] = [
  'DISPONIBLE',
  'BLOQUEADA',
  'RESERVADA',
  'VENDIDA',
  'DESCONOCIDO',
];

/** Una unidad (departamento) del stock. Su fuente natural es la planilla Excel. */
export interface Unit {
  id: string;
  projectId: string;
  departamento: string;
  piso: number | null;
  modelo: string | null;
  tipologia: string | null;
  dormitorios: number | null;
  banos: number | null;
  orientacion: string | null;
  superficieUtil: number | null;
  superficieTerraza: number | null;
  superficieTotal: number | null;
  precioListaUF: number | null;
  /** Descuento expresado como fracción (0.05 = 5%). Puede venir vacío. */
  descuentoPct: number | null;
  /** Descuento expresado como monto en UF. Puede venir vacío. */
  descuentoMontoUF: number | null;
  /** Si la planilla trae el precio final, se usa ese valor tal cual. */
  precioConDescuentoUF: number | null;
  estado: UnitStatus;
  /** Texto de estado tal como venía en la planilla, para trazabilidad. */
  estadoOriginal: string | null;
  /** Override de bono pie a nivel de unidad. `null` = usa la config del proyecto. */
  bonoPiePct: number | null;
  /** Columnas adicionales de la planilla que no mapean a un campo conocido. */
  extra: Record<string, string | number>;
  source: 'excel' | 'manual';
  updatedAt: string;
}

/** Convención de conversión de tasa anual a tasa mensual. */
export type RateConvention = 'efectivaAnual' | 'nominalAnual';

export interface BonoPieConfig {
  enabled: boolean;
  minPct: number;
  maxPct: number;
  defaultPct: number;
}

export interface CreditoDirectoConfig {
  enabled: boolean;
  /** Tope del crédito directo como fracción del precio (ej: 0.10). */
  maxPct: number;
  defaultPct: number;
  plazos: number[];
  defaultPlazo: number;
  /** Tasa anual del crédito directo. 0 = sin interés. */
  tasaAnual: number;
}

export interface IvaConfig {
  enabled: boolean;
  minPct: number;
  maxPct: number;
  defaultPct: number;
  /** Base de cálculo de la devolución. */
  base: 'precioConDescuento' | 'precioLista';
  /**
   * Si es `true`, la devolución se descuenta del precio considerado para el
   * financiamiento. Por defecto `false`: se muestra sólo como beneficio aparte.
   */
  aplicarAlFinanciamiento: boolean;
}

export interface ArriendoConfig {
  minCLP: number;
  maxCLP: number;
  stepCLP: number;
  /** `null` = sin valor sugerido; el broker debe ingresarlo. */
  defaultCLP: number | null;
}

/** Condiciones comerciales y financieras, configurables por proyecto. */
export interface ProjectConfig {
  bonoPie: BonoPieConfig;
  /** Opciones de financiamiento disponibles (LTV como fracción: 0.9, 0.8). */
  financiamiento: number[];
  financiamientoDefault: number;
  /**
   * Pie inicial/directo comprometido dentro del pie total, como fracción del
   * precio. Se usa para estructurar el pie en la opción 80%.
   */
  pieDirectoPct: number;
  creditoDirecto: CreditoDirectoConfig;
  /** Tasas hipotecarias anuales a simular en paralelo. */
  tasas: number[];
  plazosAnios: number[];
  plazoDefaultAnios: number;
  convencionTasa: RateConvention;
  iva: IvaConfig;
  arriendo: ArriendoConfig;
}

export interface ProjectMediaItem {
  url: string;
  caption?: string;
  /** Categoría para agrupar la galería. */
  grupo?: 'proyecto' | 'interiores' | 'amenities' | 'entorno' | 'planta';
}

export interface TipologiaInfo {
  nombre: string;
  dormitorios: number | null;
  banos: number | null;
  /** Superficies declaradas del brochure. `null` mientras no se carguen. */
  superficieUtil: number | null;
  superficieTerraza: number | null;
  superficieTotal: number | null;
  plantaUrl: string | null;
  nota?: string;
}

export interface Project {
  id: string;
  nombre: string;
  inmobiliaria: string | null;
  comuna: string | null;
  direccion: string | null;
  descripcion: string | null;
  imagenPrincipal: string | null;
  galeria: ProjectMediaItem[];
  brochureUrl: string | null;
  /** Bullets de entorno/conectividad tomados del brochure. */
  entorno: string[];
  conectividad: string[];
  caracteristicas: string[];
  amenities: string[];
  terminaciones: string[];
  beneficios: string[];
  tipologias: TipologiaInfo[];
  config: ProjectConfig;
  publicado: boolean;
  updatedAt: string;
}

export interface BrandSettings {
  nombreEmpresa: string;
  logoUrl: string | null;
  colorAcento: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
}

export interface AppSettings {
  /** Valor de la UF en pesos. Debe mantenerlo actualizado el administrador. */
  ufValue: number;
  ufActualizadaEl: string | null;
  brand: BrandSettings;
  disclaimer: string;
  adminPasscode: string;
}

export interface Database {
  version: number;
  projects: Project[];
  units: Unit[];
  settings: AppSettings;
}

/** Parámetros que el broker manipula en el cotizador. */
export interface QuoteParams {
  projectId: string;
  unitId: string;
  bonoPiePct: number;
  ltv: number;
  creditoDirectoPct: number;
  creditoDirectoCuotas: number;
  plazoAnios: number;
  arriendoCLP: number | null;
  ivaPct: number;
}
