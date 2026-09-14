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
  /* ── Adicionales de la planilla (estacionamiento y bodega) ────────────── */
  estacionamiento: string | null;
  estacionamiento2: string | null;
  bodega: string | null;
  bodegaBicicleta: string | null;
  /** Precio de los adicionales asociados a la unidad, en UF. */
  precioAdicionalesUF: number | null;
  /** Precio con descuento + adicionales, tal como lo trae la planilla. */
  precioNegocioFinalUF: number | null;

  /* ── Aporte inmobiliario ──────────────────────────────────────────────── */
  /** Fracción de aporte de la inmobiliaria implícita en la planilla. */
  aporteInmobiliarioPct: number | null;
  /** Precio de la unidad bajo la modalidad de aporte inmobiliario, en UF. */
  precioAporteInmobiliarioUF: number | null;

  comentarios: string | null;

  /** Override de bono pie a nivel de unidad. `null` = usa la config del proyecto. */
  bonoPiePct: number | null;
  /** Columnas adicionales de la planilla que no mapean a un campo conocido. */
  extra: Record<string, string | number>;
  source: 'excel' | 'manual';
  updatedAt: string;
}

/** Convención de conversión de tasa anual a tasa mensual. */
export type RateConvention = 'efectivaAnual' | 'nominalAnual';

/**
 * Qué precio de la planilla se usa como base de la cotización.
 *  - `departamento`: precio del depto con descuento, sin adicionales.
 *  - `negocio`: precio con descuento + estacionamiento/bodega ("precio negocio final").
 *  - `aporte`: precio bajo la modalidad de aporte inmobiliario.
 */
export type BaseCotizacion = 'departamento' | 'negocio' | 'aporte';

export interface BonoPieConfig {
  enabled: boolean;
  minPct: number;
  maxPct: number;
  defaultPct: number;
}

export interface CreditoDirectoConfig {
  enabled: boolean;
  /** Piso del crédito directo cuando se usa (ej: 0.05). 0% siempre significa no usarlo. */
  minPct: number;
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

/**
 * Supuestos de la proyección de cash flow y plusvalía.
 *
 * Salvo el fondo de puesta en marcha —que sí está documentado por la
 * inmobiliaria— ninguno de estos valores proviene de la planilla ni del
 * brochure: son supuestos que el broker ajusta. Por eso arrancan en cero y la
 * interfaz los muestra como editables, en lugar de dar por ciertos costos que
 * nadie declaró.
 */
export interface CashflowConfig {
  /** Plusvalía anual estimada de la propiedad, en términos reales. */
  plusvaliaAnual: number;
  /** Fracción del año sin arriendo. */
  vacanciaPct: number;
  /** Gasto común mensual, en pesos. */
  gastosComunesCLP: number;
  /** Contribuciones anuales, en pesos. */
  contribucionesCLPAnual: number;
  /** Comisión de administración, como fracción del arriendo. */
  administracionPct: number;
  /** Seguros mensuales, en pesos. */
  segurosCLPMensual: number;
  /** Fondo de puesta en marcha por departamento, en UF. */
  fondoPuestaEnMarchaUF: number;
  /** Fondo de puesta en marcha por estacionamiento, en UF. */
  fondoPorEstacionamientoUF: number;
  /** Otros gastos de cierre de la compra, en UF. */
  otrosGastosCompraUF: number;
  /** Años a proyectar. */
  horizontes: number[];
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
  cashflow: CashflowConfig;
}

export interface ProjectMediaItem {
  url: string;
  caption?: string;
  /** Categoría para agrupar la galería. */
  grupo?: 'proyecto' | 'interiores' | 'amenities' | 'entorno' | 'planta';
}

export interface TipologiaInfo {
  nombre: string;
  /** Número de modelo de la planilla, cuando el proyecto trabaja por modelo. */
  modelo: number | null;
  /** Pisos en que se repite el modelo, según el brochure. */
  pisos: string | null;
  orientacion: string | null;
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
  /** Condiciones comerciales y operativas documentadas del proyecto. */
  condicionesComerciales: string[];
  /** Pares dato/valor de la ficha técnica (pisos, estacionamientos, recepción…). */
  fichaTecnica: { label: string; value: string }[];
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

/**
 * Supuestos del cash flow que el broker ajusta en cada cotización. Viajan con
 * la cotización (y en su link) para que el cliente vea exactamente los mismos
 * números que se le mostraron.
 */
export interface CashflowParams {
  plusvaliaAnual: number;
  vacanciaPct: number;
  gastosComunesCLP: number;
  contribucionesCLPAnual: number;
  administracionPct: number;
  segurosCLPMensual: number;
  otrosGastosCompraUF: number;
}

/** Parámetros que el broker manipula en el cotizador. */
export interface QuoteParams {
  projectId: string;
  unitId: string;
  base: BaseCotizacion;
  bonoPiePct: number;
  ltv: number;
  creditoDirectoPct: number;
  creditoDirectoCuotas: number;
  plazoAnios: number;
  arriendoCLP: number | null;
  ivaPct: number;
  cashflow: CashflowParams;
}
