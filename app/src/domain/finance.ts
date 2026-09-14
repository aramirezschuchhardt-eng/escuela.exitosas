/**
 * Motor de cálculo del cotizador.
 *
 * Todas las funciones de este módulo son PURAS y no dependen de React ni del
 * almacenamiento. Es el único lugar donde vive la aritmética financiera, para
 * que pueda testearse de forma aislada (ver finance.test.ts).
 *
 * Unidades:
 *  - `*UF`  → montos de la propiedad, en UF.
 *  - `*CLP` → montos mensuales, en pesos chilenos.
 * No se redondea internamente: el redondeo ocurre sólo al formatear.
 */

import type { ProjectConfig, RateConvention, Unit } from './types';

export const TOLERANCIA_UF = 0.02;

/* ────────────────────────────────────────────────────────────────────────────
 * 1. PRECIO Y DESCUENTO
 * ──────────────────────────────────────────────────────────────────────────── */

export type FuentePrecio = 'planilla' | 'calculado' | 'sin-descuento' | 'sin-precio';

export interface PricingBreakdown {
  precioListaUF: number | null;
  descuentoMontoUF: number;
  descuentoPct: number;
  precioConDescuentoUF: number | null;
  /** De dónde salió el precio con descuento. */
  fuente: FuentePrecio;
  /** Descripción legible del descuento aplicado. */
  detalleDescuento: string;
  warnings: string[];
}

export interface PricingInput {
  precioListaUF: number | null;
  descuentoPct: number | null;
  descuentoMontoUF: number | null;
  precioConDescuentoUF: number | null;
}

/**
 * Resuelve precio lista / descuento / precio con descuento sin duplicar descuentos.
 *
 * Prioridad:
 *  1. Si la planilla trae `precioConDescuentoUF`, ese valor manda. El descuento se
 *     deriva por diferencia y se valida contra el % o monto declarado.
 *  2. Si no, se aplica UNA sola vez el monto de descuento (si existe) o el
 *     porcentaje de descuento (si existe) — nunca ambos.
 *  3. Si no hay descuento, precio con descuento = precio lista.
 */
export function resolvePricing(input: PricingInput): PricingBreakdown {
  const { precioListaUF, descuentoPct, descuentoMontoUF, precioConDescuentoUF } = input;
  const warnings: string[] = [];

  if (precioListaUF == null && precioConDescuentoUF == null) {
    return {
      precioListaUF: null,
      descuentoMontoUF: 0,
      descuentoPct: 0,
      precioConDescuentoUF: null,
      fuente: 'sin-precio',
      detalleDescuento: 'Sin precio en la planilla',
      warnings: ['La unidad no tiene precio cargado. Actualice el stock desde la planilla.'],
    };
  }

  // Caso 1: la planilla ya trae el precio final.
  if (precioConDescuentoUF != null) {
    const lista = precioListaUF ?? precioConDescuentoUF;
    const monto = lista - precioConDescuentoUF;
    const pct = lista > 0 ? monto / lista : 0;

    // Validación cruzada: si además viene % o monto declarado, deben coincidir.
    const declarado =
      descuentoMontoUF != null
        ? descuentoMontoUF
        : descuentoPct != null && precioListaUF != null
          ? precioListaUF * descuentoPct
          : null;
    if (declarado != null && Math.abs(declarado - monto) > TOLERANCIA_UF) {
      warnings.push(
        `Inconsistencia en la planilla: el descuento declarado (${declarado.toFixed(2)} UF) ` +
          `no coincide con la diferencia entre precio lista y precio con descuento ` +
          `(${monto.toFixed(2)} UF). Se usa el precio con descuento de la planilla.`,
      );
    }
    if (monto < -TOLERANCIA_UF) {
      warnings.push('El precio con descuento de la planilla es mayor que el precio lista.');
    }

    return {
      precioListaUF: precioListaUF ?? null,
      descuentoMontoUF: Math.max(0, monto),
      descuentoPct: Math.max(0, pct),
      precioConDescuentoUF,
      fuente: 'planilla',
      detalleDescuento:
        monto > TOLERANCIA_UF
          ? `Descuento de ${(pct * 100).toFixed(1)}% (${monto.toFixed(2)} UF) según planilla`
          : 'Precio de planilla sin descuento',
      warnings,
    };
  }

  const lista = precioListaUF as number;

  // Caso 2a: monto de descuento explícito.
  if (descuentoMontoUF != null && descuentoMontoUF > 0) {
    if (descuentoPct != null && descuentoPct > 0) {
      warnings.push(
        'La planilla trae descuento en monto y en porcentaje. Se aplica sólo el monto para no duplicar el descuento.',
      );
    }
    const final = lista - descuentoMontoUF;
    return {
      precioListaUF: lista,
      descuentoMontoUF,
      descuentoPct: lista > 0 ? descuentoMontoUF / lista : 0,
      precioConDescuentoUF: final,
      fuente: 'calculado',
      detalleDescuento: `Descuento de ${descuentoMontoUF.toFixed(2)} UF sobre precio lista`,
      warnings,
    };
  }

  // Caso 2b: porcentaje de descuento.
  if (descuentoPct != null && descuentoPct > 0) {
    const monto = lista * descuentoPct;
    return {
      precioListaUF: lista,
      descuentoMontoUF: monto,
      descuentoPct,
      precioConDescuentoUF: lista - monto,
      fuente: 'calculado',
      detalleDescuento: `Descuento de ${(descuentoPct * 100).toFixed(1)}% sobre precio lista`,
      warnings,
    };
  }

  // Caso 3: sin descuento.
  return {
    precioListaUF: lista,
    descuentoMontoUF: 0,
    descuentoPct: 0,
    precioConDescuentoUF: lista,
    fuente: 'sin-descuento',
    detalleDescuento: 'Sin descuento aplicado',
    warnings,
  };
}

export function pricingFromUnit(unit: Unit): PricingBreakdown {
  return resolvePricing({
    precioListaUF: unit.precioListaUF,
    descuentoPct: unit.descuentoPct,
    descuentoMontoUF: unit.descuentoMontoUF,
    precioConDescuentoUF: unit.precioConDescuentoUF,
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * 2. ARITMÉTICA DE CRÉDITO
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Convierte una tasa anual a tasa mensual.
 *  - `efectivaAnual`: (1 + i)^(1/12) − 1  → convención habitual en Chile.
 *  - `nominalAnual`:  i / 12              → convención nominal.
 */
export function monthlyRate(tasaAnual: number, convencion: RateConvention): number {
  if (tasaAnual <= 0) return 0;
  return convencion === 'nominalAnual' ? tasaAnual / 12 : Math.pow(1 + tasaAnual, 1 / 12) - 1;
}

/**
 * Cuota fija de un crédito (sistema francés / anualidad vencida).
 *
 *   cuota = P · i / (1 − (1 + i)^(−n))
 *
 * Con i = 0 degenera correctamente en P / n.
 */
export function annuityPayment(principal: number, tasaMensual: number, nCuotas: number): number {
  if (nCuotas <= 0 || principal <= 0) return 0;
  if (tasaMensual === 0) return principal / nCuotas;
  const factor = Math.pow(1 + tasaMensual, -nCuotas);
  return (principal * tasaMensual) / (1 - factor);
}

/* ────────────────────────────────────────────────────────────────────────────
 * 3. COTIZACIÓN COMPLETA
 * ──────────────────────────────────────────────────────────────────────────── */

export interface QuoteInput {
  pricing: PricingBreakdown;
  config: ProjectConfig;
  ufValue: number;
  bonoPiePct: number;
  ltv: number;
  creditoDirectoPct: number;
  creditoDirectoCuotas: number;
  plazoAnios: number;
  arriendoCLP: number | null;
  ivaPct: number;
}

export interface DividendoEscenario {
  tasaAnual: number;
  tasaMensual: number;
  dividendoUF: number;
  dividendoCLP: number;
  /** Dividendo + cuota de crédito directo, durante la vigencia del crédito directo. */
  desembolsoEtapa1CLP: number;
  /** Sólo dividendo, una vez terminado el crédito directo. */
  desembolsoEtapa2CLP: number;
  flujoEtapa1CLP: number | null;
  flujoEtapa2CLP: number | null;
  /** Costo total del crédito hipotecario sobre todo el plazo. */
  totalPagadoUF: number;
  interesesTotalesUF: number;
}

export interface QuoteResult {
  pricing: PricingBreakdown;
  /** Valor de UF usado en esta cotización, para convertir cualquier monto a pesos. */
  ufValue: number;
  precioConsideradoUF: number;
  precioConsideradoCLP: number;

  bonoPiePct: number;
  bonoPieUF: number;

  ltv: number;
  pieTotalPct: number;
  pieTotalUF: number;
  creditoHipotecarioUF: number;
  creditoHipotecarioCLP: number;

  creditoDirectoAplica: boolean;
  creditoDirectoPct: number;
  creditoDirectoUF: number;
  creditoDirectoCuotas: number;
  cuotaCreditoDirectoUF: number;
  cuotaCreditoDirectoCLP: number;

  /** Lo que el cliente debe aportar de su bolsillo. */
  aporteEfectivoUF: number;
  aporteEfectivoCLP: number;

  plazoAnios: number;
  dividendos: DividendoEscenario[];

  arriendoCLP: number | null;
  arriendoAnualCLP: number | null;
  rentabilidadBrutaAnual: number | null;

  ivaAplica: boolean;
  ivaPct: number;
  ivaBaseUF: number;
  ivaMontoUF: number;
  ivaMontoCLP: number;
  valorEfectivoPostIvaUF: number;

  warnings: string[];
}

/** Restringe un valor al rango [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeQuote(input: QuoteInput): QuoteResult {
  const {
    pricing,
    config,
    ufValue,
    ltv,
    creditoDirectoCuotas,
    plazoAnios,
    arriendoCLP,
  } = input;
  const warnings = [...pricing.warnings];

  const precioBaseUF = pricing.precioConDescuentoUF ?? 0;

  // ── Devolución de IVA ────────────────────────────────────────────────────
  const ivaAplica = config.iva.enabled;
  const ivaPct = ivaAplica ? clamp(input.ivaPct, config.iva.minPct, config.iva.maxPct) : 0;
  const ivaBaseUF =
    config.iva.base === 'precioLista'
      ? (pricing.precioListaUF ?? precioBaseUF)
      : precioBaseUF;
  const ivaMontoUF = ivaAplica ? ivaBaseUF * ivaPct : 0;

  /*
   * Por defecto la devolución de IVA NO reduce el precio financiado: se presenta
   * como un beneficio estimado aparte. Sólo se descuenta si el proyecto está
   * explícitamente configurado para hacerlo.
   */
  const precioConsideradoUF =
    ivaAplica && config.iva.aplicarAlFinanciamiento ? precioBaseUF - ivaMontoUF : precioBaseUF;

  // ── Bono pie ─────────────────────────────────────────────────────────────
  const bonoPieAplica = config.bonoPie.enabled;
  const bonoPiePct = bonoPieAplica
    ? clamp(input.bonoPiePct, config.bonoPie.minPct, config.bonoPie.maxPct)
    : 0;
  const bonoPieUF = precioConsideradoUF * bonoPiePct;

  // ── Estructura de financiamiento ─────────────────────────────────────────
  const pieTotalPct = 1 - ltv;
  const pieTotalUF = precioConsideradoUF * pieTotalPct;
  const creditoHipotecarioUF = precioConsideradoUF * ltv;

  // ── Crédito directo inmobiliario ─────────────────────────────────────────
  const cdAplica = config.creditoDirecto.enabled && input.creditoDirectoPct > 0;
  const creditoDirectoPctSolicitado = cdAplica ? input.creditoDirectoPct : 0;
  // El crédito directo no puede superar ni el tope del proyecto ni el pie total.
  const creditoDirectoPct = clamp(
    creditoDirectoPctSolicitado,
    0,
    Math.min(config.creditoDirecto.maxPct, pieTotalPct),
  );
  if (creditoDirectoPctSolicitado > creditoDirectoPct + 1e-9) {
    warnings.push(
      `El crédito directo se limitó a ${(creditoDirectoPct * 100).toFixed(1)}% ` +
        `(tope del proyecto ${(config.creditoDirecto.maxPct * 100).toFixed(0)}% y pie total ` +
        `${(pieTotalPct * 100).toFixed(0)}%).`,
    );
  }
  const creditoDirectoUF = precioConsideradoUF * creditoDirectoPct;
  const cuotaCreditoDirectoUF = annuityPayment(
    creditoDirectoUF,
    monthlyRate(config.creditoDirecto.tasaAnual, config.convencionTasa),
    creditoDirectoCuotas,
  );

  // ── Aporte efectivo del cliente ──────────────────────────────────────────
  const aporteBrutoUF = pieTotalUF - creditoDirectoUF - bonoPieUF;
  const aporteEfectivoUF = Math.max(0, aporteBrutoUF);
  if (aporteBrutoUF < -TOLERANCIA_UF) {
    warnings.push(
      'El bono pie y el crédito directo superan el pie requerido. Revise las condiciones del proyecto.',
    );
  }

  // ── Dividendo hipotecario en los 3 escenarios de tasa ────────────────────
  const nCuotasHipotecarias = plazoAnios * 12;
  const dividendos: DividendoEscenario[] = config.tasas.map((tasaAnual) => {
    const tasaMensual = monthlyRate(tasaAnual, config.convencionTasa);
    const dividendoUF = annuityPayment(creditoHipotecarioUF, tasaMensual, nCuotasHipotecarias);
    const dividendoCLP = dividendoUF * ufValue;
    const cuotaCdCLP = cuotaCreditoDirectoUF * ufValue;
    const desembolsoEtapa1CLP = dividendoCLP + cuotaCdCLP;
    const desembolsoEtapa2CLP = dividendoCLP;
    const totalPagadoUF = dividendoUF * nCuotasHipotecarias;
    return {
      tasaAnual,
      tasaMensual,
      dividendoUF,
      dividendoCLP,
      desembolsoEtapa1CLP,
      desembolsoEtapa2CLP,
      flujoEtapa1CLP: arriendoCLP != null ? arriendoCLP - desembolsoEtapa1CLP : null,
      flujoEtapa2CLP: arriendoCLP != null ? arriendoCLP - desembolsoEtapa2CLP : null,
      totalPagadoUF,
      interesesTotalesUF: totalPagadoUF - creditoHipotecarioUF,
    };
  });

  // ── Arriendo y rentabilidad ──────────────────────────────────────────────
  const arriendoAnualCLP = arriendoCLP != null ? arriendoCLP * 12 : null;
  const precioConsideradoCLP = precioConsideradoUF * ufValue;
  const rentabilidadBrutaAnual =
    arriendoAnualCLP != null && precioConsideradoCLP > 0
      ? arriendoAnualCLP / precioConsideradoCLP
      : null;

  return {
    pricing,
    ufValue,
    precioConsideradoUF,
    precioConsideradoCLP,
    bonoPiePct,
    bonoPieUF,
    ltv,
    pieTotalPct,
    pieTotalUF,
    creditoHipotecarioUF,
    creditoHipotecarioCLP: creditoHipotecarioUF * ufValue,
    creditoDirectoAplica: creditoDirectoUF > 0,
    creditoDirectoPct,
    creditoDirectoUF,
    creditoDirectoCuotas,
    cuotaCreditoDirectoUF,
    cuotaCreditoDirectoCLP: cuotaCreditoDirectoUF * ufValue,
    aporteEfectivoUF,
    aporteEfectivoCLP: aporteEfectivoUF * ufValue,
    plazoAnios,
    dividendos,
    arriendoCLP,
    arriendoAnualCLP,
    rentabilidadBrutaAnual,
    ivaAplica,
    ivaPct,
    ivaBaseUF,
    ivaMontoUF,
    ivaMontoCLP: ivaMontoUF * ufValue,
    valorEfectivoPostIvaUF: precioBaseUF - ivaMontoUF,
    warnings,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * 4. COMPARACIÓN DE ESCENARIOS
 * ──────────────────────────────────────────────────────────────────────────── */

export interface EscenarioDefinicion {
  nombre: string;
  ltv: number;
  tasaAnual: number;
  usarCreditoDirecto: boolean;
}

export interface EscenarioResultado extends EscenarioDefinicion {
  disponible: boolean;
  motivoNoDisponible?: string;
  quote: QuoteResult;
  dividendo: DividendoEscenario | null;
}

/**
 * Construye los 3 escenarios comparables. Cada uno recalcula la cotización
 * completa con su propio LTV, de modo que los montos de pie y crédito son los
 * que realmente corresponden a ese escenario.
 */
export function computeEscenarios(
  base: QuoteInput,
  definiciones: EscenarioDefinicion[],
): EscenarioResultado[] {
  return definiciones.map((def) => {
    const ltvDisponible = base.config.financiamiento.includes(def.ltv);
    const ltv = ltvDisponible ? def.ltv : base.config.financiamientoDefault;
    const usaCd = def.usarCreditoDirecto && base.config.creditoDirecto.enabled;
    const quote = computeQuote({
      ...base,
      ltv,
      creditoDirectoPct: usaCd ? base.creditoDirectoPct : 0,
    });
    // La tasa del escenario puede no estar en la lista configurada del proyecto;
    // en ese caso se calcula igualmente para poder comparar.
    const existente = quote.dividendos.find((d) => Math.abs(d.tasaAnual - def.tasaAnual) < 1e-9);
    const dividendo =
      existente ??
      (() => {
        const tasaMensual = monthlyRate(def.tasaAnual, base.config.convencionTasa);
        const dividendoUF = annuityPayment(
          quote.creditoHipotecarioUF,
          tasaMensual,
          quote.plazoAnios * 12,
        );
        const dividendoCLP = dividendoUF * base.ufValue;
        const desembolsoEtapa1CLP = dividendoCLP + quote.cuotaCreditoDirectoCLP;
        const totalPagadoUF = dividendoUF * quote.plazoAnios * 12;
        return {
          tasaAnual: def.tasaAnual,
          tasaMensual,
          dividendoUF,
          dividendoCLP,
          desembolsoEtapa1CLP,
          desembolsoEtapa2CLP: dividendoCLP,
          flujoEtapa1CLP:
            base.arriendoCLP != null ? base.arriendoCLP - desembolsoEtapa1CLP : null,
          flujoEtapa2CLP: base.arriendoCLP != null ? base.arriendoCLP - dividendoCLP : null,
          totalPagadoUF,
          interesesTotalesUF: totalPagadoUF - quote.creditoHipotecarioUF,
        } satisfies DividendoEscenario;
      })();

    return {
      ...def,
      ltv,
      disponible: ltvDisponible,
      motivoNoDisponible: ltvDisponible
        ? undefined
        : `El proyecto no ofrece financiamiento ${(def.ltv * 100).toFixed(0)}%. Se muestra con ${(ltv * 100).toFixed(0)}%.`,
      quote,
      dividendo,
    };
  });
}
