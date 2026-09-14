/**
 * Proyección de cash flow y plusvalía.
 *
 * Funciones puras, igual que el resto del motor. Todo el modelo trabaja en UF
 * porque la propiedad, el crédito hipotecario y el dividendo están en UF: es
 * decir, en términos reales, ya descontada la inflación. Los costos que el
 * broker ingresa en pesos se convierten a UF con el valor configurado y se
 * tratan como reajustables por inflación, que es la convención chilena para
 * contribuciones, gastos comunes y contratos de arriendo.
 */

import type { QuoteResult } from './finance';
import type { CashflowConfig, CashflowParams } from './types';

/* ────────────────────────────────────────────────────────────────────────────
 * 1. ARITMÉTICA
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Saldo insoluto de un crédito de cuota fija tras `k` cuotas pagadas.
 *
 *   saldo = P · [(1+i)^n − (1+i)^k] / [(1+i)^n − 1]
 *
 * Con i = 0 degenera en la amortización lineal P · (1 − k/n).
 */
export function saldoInsoluto(
  principal: number,
  tasaMensual: number,
  nCuotas: number,
  cuotasPagadas: number,
): number {
  if (principal <= 0 || nCuotas <= 0) return 0;
  const k = Math.min(Math.max(cuotasPagadas, 0), nCuotas);
  if (tasaMensual === 0) return principal * (1 - k / nCuotas);
  const fn = Math.pow(1 + tasaMensual, nCuotas);
  const fk = Math.pow(1 + tasaMensual, k);
  return (principal * (fn - fk)) / (fn - 1);
}

/**
 * Tasa interna de retorno de una serie de flujos, por bisección.
 *
 * Se prefiere la bisección a Newton-Raphson porque no diverge: el VAN es
 * monótono decreciente en la tasa cuando hay un solo cambio de signo, que es el
 * caso de una inversión inmobiliaria (un desembolso inicial y luego flujos).
 * Devuelve `null` si no hay cambio de signo o no converge.
 */
export function tir(flujos: number[], tolerancia = 1e-7, iteraciones = 200): number | null {
  if (flujos.length < 2) return null;
  const hayPositivo = flujos.some((f) => f > 0);
  const hayNegativo = flujos.some((f) => f < 0);
  if (!hayPositivo || !hayNegativo) return null;

  const van = (tasa: number): number =>
    flujos.reduce((acc, f, t) => acc + f / Math.pow(1 + tasa, t), 0);

  let bajo = -0.9999;
  let alto = 1;
  let vanBajo = van(bajo);
  let vanAlto = van(alto);
  // Ensancha el extremo superior si la TIR es muy alta.
  let intentos = 0;
  while (vanBajo * vanAlto > 0 && intentos < 40) {
    alto *= 2;
    vanAlto = van(alto);
    intentos++;
  }
  if (vanBajo * vanAlto > 0) return null;

  for (let i = 0; i < iteraciones; i++) {
    const medio = (bajo + alto) / 2;
    const vanMedio = van(medio);
    if (Math.abs(vanMedio) < tolerancia) return medio;
    if (vanBajo * vanMedio <= 0) {
      alto = medio;
      vanAlto = vanMedio;
    } else {
      bajo = medio;
      vanBajo = vanMedio;
    }
  }
  return (bajo + alto) / 2;
}

/* ────────────────────────────────────────────────────────────────────────────
 * 2. TIPOS
 * ──────────────────────────────────────────────────────────────────────────── */

/** Detalle de un mes tipo, en UF. */
export interface DetalleMensual {
  arriendoBrutoUF: number;
  vacanciaUF: number;
  gastosComunesUF: number;
  contribucionesUF: number;
  administracionUF: number;
  segurosUF: number;
  /** Arriendo bruto menos vacancia y todos los costos de operación. */
  arriendoNetoUF: number;
  dividendoUF: number;
  cuotaCreditoDirectoUF: number;
  /** Arriendo neto menos dividendo y cuota de crédito directo. */
  flujoNetoUF: number;
  /** Suma de todos los costos de operación (sin dividendo ni crédito directo). */
  costosOperacionUF: number;
}

export interface AnioProyeccion {
  anio: number;
  valorPropiedadUF: number;
  saldoHipotecarioUF: number;
  saldoCreditoDirectoUF: number;
  /** Valor de la propiedad menos la deuda pendiente. */
  patrimonioUF: number;
  flujoAcumuladoUF: number;

  /* Componentes de la ganancia */
  plusvaliaUF: number;
  amortizacionUF: number;
  /**
   * Parte del bono pie que realmente rebajó el desembolso del cliente.
   *
   * Puede ser menor que el bono pie nominal: si el crédito directo ya cubre todo
   * el pie, el bono sobrante no reduce nada y no se cuenta como ganancia.
   */
  bonoPieAplicadoUF: number;
  gastosCompraUF: number;

  /**
   * patrimonio + flujo acumulado − inversión inicial.
   * Equivale a plusvalía + amortización + flujo + bono pie aplicado − gastos.
   */
  gananciaTotalUF: number;
  /** Ganancia total sobre la inversión inicial. */
  retornoSobreInversion: number | null;
  /** TIR anualizada de los flujos mensuales más la venta al final del período. */
  tirAnual: number | null;
}

export interface CashflowResult {
  /* Inversión inicial */
  aporteEfectivoUF: number;
  fondoPuestaEnMarchaUF: number;
  otrosGastosCompraUF: number;
  gastosCompraUF: number;
  inversionInicialUF: number;

  mensual: { etapa1: DetalleMensual; etapa2: DetalleMensual };
  /** Meses en que rige la etapa 1 (mientras dura el crédito directo). */
  mesesEtapa1: number;

  proyeccion: AnioProyeccion[];
  plusvaliaAnual: number;
  ufValue: number;
  warnings: string[];
}

/** Combina los valores fijos del proyecto con los supuestos de esta cotización. */
export function mergeCashflowConfig(
  proyecto: CashflowConfig,
  params: CashflowParams,
): CashflowConfig {
  return { ...proyecto, ...params };
}

/** Supuestos iniciales de una cotización, tomados de la configuración del proyecto. */
export function cashflowParamsFrom(config: CashflowConfig): CashflowParams {
  return {
    plusvaliaAnual: config.plusvaliaAnual,
    vacanciaPct: config.vacanciaPct,
    gastosComunesCLP: config.gastosComunesCLP,
    contribucionesCLPAnual: config.contribucionesCLPAnual,
    administracionPct: config.administracionPct,
    segurosCLPMensual: config.segurosCLPMensual,
    otrosGastosCompraUF: config.otrosGastosCompraUF,
  };
}

export interface CashflowInput {
  quote: QuoteResult;
  config: CashflowConfig;
  /** Tasa hipotecaria del escenario que se está mostrando. */
  tasaAnual: number;
  /** Estacionamientos asociados a la unidad, para el fondo de puesta en marcha. */
  estacionamientos: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * 3. PROYECCIÓN
 * ──────────────────────────────────────────────────────────────────────────── */

export function computeCashflow(input: CashflowInput): CashflowResult {
  const { quote, config, tasaAnual, estacionamientos } = input;
  const uf = quote.ufValue;
  const warnings: string[] = [];

  const escenario =
    quote.dividendos.find((d) => Math.abs(d.tasaAnual - tasaAnual) < 1e-9) ?? quote.dividendos[0];
  const dividendoUF = escenario?.dividendoUF ?? 0;

  /* ── Inversión inicial ─────────────────────────────────────────────────── */
  const fondoPuestaEnMarchaUF =
    config.fondoPuestaEnMarchaUF + config.fondoPorEstacionamientoUF * estacionamientos;
  const gastosCompraUF = fondoPuestaEnMarchaUF + config.otrosGastosCompraUF;
  const inversionInicialUF = quote.aporteEfectivoUF + gastosCompraUF;

  /* ── Mes tipo ──────────────────────────────────────────────────────────── */
  const aUF = (clp: number): number => (uf > 0 ? clp / uf : 0);
  if (uf <= 0 && quote.arriendoCLP != null) {
    warnings.push(
      'Sin valor de UF configurado no es posible convertir el arriendo ni los costos en pesos. ' +
        'Regístrelo en Administrar → Configuración.',
    );
  }

  const arriendoBrutoUF = aUF(quote.arriendoCLP ?? 0);
  const vacanciaUF = arriendoBrutoUF * config.vacanciaPct;
  const administracionUF = (arriendoBrutoUF - vacanciaUF) * config.administracionPct;
  const gastosComunesUF = aUF(config.gastosComunesCLP);
  const contribucionesUF = aUF(config.contribucionesCLPAnual) / 12;
  const segurosUF = aUF(config.segurosCLPMensual);

  const costosOperacionUF =
    vacanciaUF + administracionUF + gastosComunesUF + contribucionesUF + segurosUF;
  const arriendoNetoUF = arriendoBrutoUF - costosOperacionUF;

  const cuotaCreditoDirectoUF = quote.cuotaCreditoDirectoUF;
  const mesesEtapa1 = quote.creditoDirectoUF > 0 ? quote.creditoDirectoCuotas : 0;

  const base = {
    arriendoBrutoUF,
    vacanciaUF,
    gastosComunesUF,
    contribucionesUF,
    administracionUF,
    segurosUF,
    arriendoNetoUF,
    costosOperacionUF,
    dividendoUF,
  };
  const etapa1: DetalleMensual = {
    ...base,
    cuotaCreditoDirectoUF,
    flujoNetoUF: arriendoNetoUF - dividendoUF - cuotaCreditoDirectoUF,
  };
  const etapa2: DetalleMensual = {
    ...base,
    cuotaCreditoDirectoUF: 0,
    flujoNetoUF: arriendoNetoUF - dividendoUF,
  };

  /* ── Proyección por horizonte ──────────────────────────────────────────── */
  // Las tasas mensuales ya vienen resueltas por el motor con la convención del
  // proyecto: no se recalculan aquí para no arriesgar que diverjan.
  const tasaMensualHipotecaria = escenario?.tasaMensual ?? 0;
  const nCuotasHipotecarias = quote.plazoAnios * 12;
  const tasaMensualCd = quote.creditoDirectoTasaMensual;

  /** Flujo del mes `m` (1-indexado). */
  const flujoMes = (m: number): number => (m <= mesesEtapa1 ? etapa1.flujoNetoUF : etapa2.flujoNetoUF);

  const proyeccion: AnioProyeccion[] = config.horizontes.map((anio) => {
    const meses = anio * 12;
    const valorPropiedadUF = quote.precioBaseUF * Math.pow(1 + config.plusvaliaAnual, anio);

    const saldoHipotecarioUF = saldoInsoluto(
      quote.creditoHipotecarioUF,
      tasaMensualHipotecaria,
      nCuotasHipotecarias,
      meses,
    );
    const saldoCreditoDirectoUF = saldoInsoluto(
      quote.creditoDirectoUF,
      tasaMensualCd,
      quote.creditoDirectoCuotas,
      meses,
    );
    const patrimonioUF = valorPropiedadUF - saldoHipotecarioUF - saldoCreditoDirectoUF;

    let flujoAcumuladoUF = 0;
    const flujos: number[] = [-inversionInicialUF];
    for (let m = 1; m <= meses; m++) {
      const f = flujoMes(m);
      flujoAcumuladoUF += f;
      flujos.push(f);
    }
    // La venta al final del horizonte cierra la serie para el cálculo de TIR.
    flujos[flujos.length - 1] += patrimonioUF;

    const plusvaliaUF = valorPropiedadUF - quote.precioBaseUF;
    const amortizacionUF =
      quote.creditoHipotecarioUF -
      saldoHipotecarioUF +
      (quote.creditoDirectoUF - saldoCreditoDirectoUF);

    /*
     * La ganancia se define sin ambigüedad como lo que el inversionista termina
     * teniendo menos lo que puso: patrimonio + flujo acumulado − inversión
     * inicial. Esa es la cifra que se muestra.
     *
     * Para explicarla al cliente se descompone en plusvalía, amortización de la
     * deuda, flujo acumulado y el bono pie, menos los gastos de compra. El bono
     * pie se despeja como residuo en lugar de darlo por hecho: si el crédito
     * directo ya cubría todo el pie, el bono no rebajó nada y el residuo da cero,
     * que es lo correcto. Así las partes siempre suman el total.
     */
    const gananciaTotalUF = patrimonioUF + flujoAcumuladoUF - inversionInicialUF;
    const bonoPieAplicadoUF =
      gananciaTotalUF - (plusvaliaUF + amortizacionUF + flujoAcumuladoUF - gastosCompraUF);

    const tirMensual = tir(flujos);

    return {
      anio,
      valorPropiedadUF,
      saldoHipotecarioUF,
      saldoCreditoDirectoUF,
      patrimonioUF,
      flujoAcumuladoUF,
      plusvaliaUF,
      amortizacionUF,
      bonoPieAplicadoUF,
      gastosCompraUF,
      gananciaTotalUF,
      retornoSobreInversion:
        inversionInicialUF > 0 ? gananciaTotalUF / inversionInicialUF : null,
      tirAnual: tirMensual == null ? null : Math.pow(1 + tirMensual, 12) - 1,
    };
  });

  return {
    aporteEfectivoUF: quote.aporteEfectivoUF,
    fondoPuestaEnMarchaUF,
    otrosGastosCompraUF: config.otrosGastosCompraUF,
    gastosCompraUF,
    inversionInicialUF,
    mensual: { etapa1, etapa2 },
    mesesEtapa1,
    proyeccion,
    plusvaliaAnual: config.plusvaliaAnual,
    ufValue: uf,
    warnings,
  };
}
