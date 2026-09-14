import type { AppSettings, ProjectConfig } from './types';

/**
 * Condiciones comerciales por defecto de un proyecto nuevo.
 *
 * IMPORTANTE: son sólo el punto de partida del formulario. Cada proyecto guarda
 * su propia copia y puede diferir en todo (un proyecto puede no tener bono pie,
 * otro no ofrecer crédito directo, otro permitir sólo 80%, etc.).
 */
export function defaultProjectConfig(): ProjectConfig {
  return {
    bonoPie: { enabled: true, minPct: 0, maxPct: 0.1, defaultPct: 0 },
    financiamiento: [0.9, 0.8],
    financiamientoDefault: 0.9,
    pieDirectoPct: 0.1,
    creditoDirecto: {
      enabled: true,
      minPct: 0,
      maxPct: 0.1,
      defaultPct: 0.1,
      plazos: [12, 24, 36, 48, 60],
      defaultPlazo: 60,
      tasaAnual: 0,
    },
    tasas: [0.032, 0.04, 0.045],
    plazosAnios: [15, 20, 25, 30],
    plazoDefaultAnios: 30,
    convencionTasa: 'efectivaAnual',
    iva: {
      enabled: true,
      minPct: 0.1,
      maxPct: 0.15,
      defaultPct: 0.1,
      base: 'precioConDescuento',
      aplicarAlFinanciamiento: false,
    },
    arriendo: { minCLP: 300_000, maxCLP: 500_000, stepCLP: 10_000, defaultCLP: null },
    cashflow: {
      plusvaliaAnual: 0.045,
      // Costos de operación: en cero mientras no estén documentados o el broker
      // los cargue. Se editan en el propio cotizador y en el panel.
      vacanciaPct: 0,
      gastosComunesCLP: 0,
      contribucionesCLPAnual: 0,
      administracionPct: 0,
      segurosCLPMensual: 0,
      fondoPuestaEnMarchaUF: 0,
      fondoPorEstacionamientoUF: 0,
      otrosGastosCompraUF: 0,
      horizontes: [3, 5, 10],
    },
  };
}

export const DISCLAIMER_DEFAULT =
  'Simulación referencial. Precios, disponibilidad, descuentos, bonos, condiciones ' +
  'comerciales, financiamiento, tasas, seguros, gastos operacionales y demás condiciones ' +
  'están sujetos a confirmación y aprobación según corresponda.';

export function defaultSettings(): AppSettings {
  return {
    /*
     * Valor de UF de partida. NO es un dato de los documentos del proyecto:
     * es un parámetro que el administrador debe mantener actualizado.
     */
    ufValue: 0,
    ufActualizadaEl: null,
    brand: {
      nombreEmpresa: 'Avance Inmobiliario',
      logoUrl: null,
      colorAcento: '#14707E',
      contactoNombre: '',
      contactoEmail: '',
      contactoTelefono: '',
    },
    disclaimer: DISCLAIMER_DEFAULT,
    adminPasscode: 'admin',
  };
}
