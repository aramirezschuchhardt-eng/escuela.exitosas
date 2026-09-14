import { describe, expect, it } from 'vitest';
import { computeCashflow, saldoInsoluto, tir, type CashflowInput } from './cashflow';
import { annuityPayment, computeQuote, monthlyRate, resolvePricing } from './finance';
import type { CashflowConfig, ProjectConfig } from './types';

const config: ProjectConfig = {
  bonoPie: { enabled: true, minPct: 0, maxPct: 0.1, defaultPct: 0 },
  financiamiento: [0.9, 0.8],
  financiamientoDefault: 0.9,
  pieDirectoPct: 0.1,
  creditoDirecto: {
    enabled: true,
    minPct: 0.05,
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
    vacanciaPct: 0,
    gastosComunesCLP: 0,
    contribucionesCLPAnual: 0,
    administracionPct: 0,
    segurosCLPMensual: 0,
    fondoPuestaEnMarchaUF: 10,
    fondoPorEstacionamientoUF: 1.5,
    otrosGastosCompraUF: 0,
    horizontes: [3, 5, 10],
  },
};

const UF = 40_901.94;

/** Cotización de referencia: depto 207 de la planilla real. */
const quoteBase = (over: Partial<Parameters<typeof computeQuote>[0]> = {}) =>
  computeQuote({
    pricing: resolvePricing({
      precioListaUF: 4067.4,
      descuentoPct: 0.1,
      descuentoMontoUF: null,
      precioConDescuentoUF: 3660.66,
    }),
    config,
    ufValue: UF,
    bonoPiePct: 0,
    ltv: 0.9,
    creditoDirectoPct: 0.1,
    creditoDirectoCuotas: 60,
    plazoAnios: 30,
    arriendoCLP: 420_000,
    ivaPct: 0.1,
    ...over,
  });

const cashflowBase = (over: Partial<CashflowInput> = {}): CashflowInput => ({
  quote: quoteBase(),
  config: config.cashflow,
  tasaAnual: 0.032,
  estacionamientos: 0,
  ...over,
});

describe('saldoInsoluto', () => {
  it('parte en el capital completo y termina en cero', () => {
    expect(saldoInsoluto(1000, 0.004, 240, 0)).toBeCloseTo(1000, 6);
    expect(saldoInsoluto(1000, 0.004, 240, 240)).toBeCloseTo(0, 6);
  });

  it('amortiza linealmente cuando la tasa es cero', () => {
    expect(saldoInsoluto(6000, 0, 60, 30)).toBeCloseTo(3000, 6);
    expect(saldoInsoluto(6000, 0, 60, 12)).toBeCloseTo(4800, 6);
  });

  it('coincide con la amortización mes a mes', () => {
    const P = 2500;
    const i = 0.0026;
    const n = 360;
    const cuota = annuityPayment(P, i, n);
    let saldo = P;
    for (let k = 1; k <= 120; k++) saldo = saldo * (1 + i) - cuota;
    expect(saldoInsoluto(P, i, n, 120)).toBeCloseTo(saldo, 6);
  });

  it('con interés amortiza más lento que linealmente', () => {
    // A mitad de plazo, un crédito con interés debe más de la mitad del capital.
    expect(saldoInsoluto(1000, 0.004, 240, 120)).toBeGreaterThan(500);
  });

  it('no devuelve saldo negativo pasado el plazo', () => {
    expect(saldoInsoluto(1000, 0.004, 60, 120)).toBeCloseTo(0, 6);
  });

  it('es cero para capital nulo', () => {
    expect(saldoInsoluto(0, 0.004, 240, 12)).toBe(0);
  });
});

describe('tir', () => {
  it('resuelve un caso conocido', () => {
    // −100 hoy y 110 en un período → 10%.
    expect(tir([-100, 110])!).toBeCloseTo(0.1, 6);
  });

  it('anula el VAN a la tasa que encuentra', () => {
    const flujos = [-1000, 200, 300, 400, 500];
    const r = tir(flujos)!;
    const van = flujos.reduce((a, f, t) => a + f / Math.pow(1 + r, t), 0);
    expect(van).toBeCloseTo(0, 5);
  });

  it('devuelve null si no hay cambio de signo', () => {
    expect(tir([-100, -50, -20])).toBeNull();
    expect(tir([100, 50])).toBeNull();
  });

  it('maneja una TIR negativa', () => {
    const r = tir([-1000, 400, 400])!;
    expect(r).toBeLessThan(0);
  });
});

describe('computeCashflow — inversión inicial', () => {
  it('suma aporte efectivo, fondo de puesta en marcha y otros gastos', () => {
    const r = computeCashflow(cashflowBase({ estacionamientos: 1 }));
    // 10 UF por depto + 1,5 UF por estacionamiento
    expect(r.fondoPuestaEnMarchaUF).toBeCloseTo(11.5, 6);
    expect(r.inversionInicialUF).toBeCloseTo(r.aporteEfectivoUF + 11.5, 6);
  });

  it('cuenta sólo el departamento cuando no hay estacionamiento', () => {
    const r = computeCashflow(cashflowBase());
    expect(r.fondoPuestaEnMarchaUF).toBeCloseTo(10, 6);
  });
});

describe('computeCashflow — mes tipo', () => {
  it('descuenta todos los costos de operación del arriendo', () => {
    const cfg: CashflowConfig = {
      ...config.cashflow,
      vacanciaPct: 0.08,
      gastosComunesCLP: 60_000,
      contribucionesCLPAnual: 240_000,
      administracionPct: 0.1,
      segurosCLPMensual: 12_000,
    };
    const r = computeCashflow(cashflowBase({ config: cfg }));
    const m = r.mensual.etapa1;
    const arriendo = 420_000 / UF;

    expect(m.arriendoBrutoUF).toBeCloseTo(arriendo, 8);
    expect(m.vacanciaUF).toBeCloseTo(arriendo * 0.08, 8);
    // La administración se cobra sobre lo efectivamente recaudado.
    expect(m.administracionUF).toBeCloseTo(arriendo * 0.92 * 0.1, 8);
    expect(m.gastosComunesUF).toBeCloseTo(60_000 / UF, 8);
    expect(m.contribucionesUF).toBeCloseTo(240_000 / UF / 12, 8);
    expect(m.segurosUF).toBeCloseTo(12_000 / UF, 8);
    expect(m.arriendoNetoUF).toBeCloseTo(m.arriendoBrutoUF - m.costosOperacionUF, 8);
  });

  it('separa las dos etapas por el crédito directo', () => {
    const r = computeCashflow(cashflowBase());
    expect(r.mesesEtapa1).toBe(60);
    expect(r.mensual.etapa1.cuotaCreditoDirectoUF).toBeGreaterThan(0);
    expect(r.mensual.etapa2.cuotaCreditoDirectoUF).toBe(0);
    expect(r.mensual.etapa2.flujoNetoUF - r.mensual.etapa1.flujoNetoUF).toBeCloseTo(
      r.mensual.etapa1.cuotaCreditoDirectoUF,
      8,
    );
  });

  it('sin crédito directo ambas etapas son iguales', () => {
    const r = computeCashflow(cashflowBase({ quote: quoteBase({ creditoDirectoPct: 0 }) }));
    expect(r.mesesEtapa1).toBe(0);
    expect(r.mensual.etapa1.flujoNetoUF).toBeCloseTo(r.mensual.etapa2.flujoNetoUF, 8);
  });

  it('sin costos, el flujo es arriendo menos dividendo menos cuota', () => {
    const r = computeCashflow(cashflowBase());
    const m = r.mensual.etapa1;
    expect(m.costosOperacionUF).toBe(0);
    expect(m.flujoNetoUF).toBeCloseTo(
      m.arriendoBrutoUF - m.dividendoUF - m.cuotaCreditoDirectoUF,
      8,
    );
  });
});

describe('computeCashflow — plusvalía y proyección', () => {
  it('proyecta los horizontes configurados', () => {
    const r = computeCashflow(cashflowBase());
    expect(r.proyeccion.map((p) => p.anio)).toEqual([3, 5, 10]);
  });

  it('capitaliza la plusvalía al 4,5% anual', () => {
    const r = computeCashflow(cashflowBase());
    const precio = 3660.66;
    expect(r.proyeccion[0].valorPropiedadUF).toBeCloseTo(precio * Math.pow(1.045, 3), 6);
    expect(r.proyeccion[2].valorPropiedadUF).toBeCloseTo(precio * Math.pow(1.045, 10), 6);
    expect(r.proyeccion[2].plusvaliaUF).toBeCloseTo(
      precio * Math.pow(1.045, 10) - precio,
      6,
    );
  });

  it('el crédito directo queda saldado tras sus 60 cuotas', () => {
    const r = computeCashflow(cashflowBase());
    expect(r.proyeccion[0].saldoCreditoDirectoUF).toBeGreaterThan(0); // año 3
    expect(r.proyeccion[1].saldoCreditoDirectoUF).toBeCloseTo(0, 6); // año 5
    expect(r.proyeccion[2].saldoCreditoDirectoUF).toBeCloseTo(0, 6); // año 10
  });

  it('el patrimonio es el valor de la propiedad menos la deuda', () => {
    const r = computeCashflow(cashflowBase());
    for (const p of r.proyeccion) {
      expect(p.patrimonioUF).toBeCloseTo(
        p.valorPropiedadUF - p.saldoHipotecarioUF - p.saldoCreditoDirectoUF,
        6,
      );
    }
  });

  it('la ganancia equivale a patrimonio + flujo acumulado − inversión inicial', () => {
    // Identidad clave: verifica que la descomposición mostrada al cliente
    // (plusvalía + amortización + flujo + bono pie − gastos) es la misma cifra.
    const r = computeCashflow(cashflowBase({ quote: quoteBase({ bonoPiePct: 0.05 }) }));
    for (const p of r.proyeccion) {
      expect(p.gananciaTotalUF).toBeCloseTo(
        p.patrimonioUF + p.flujoAcumuladoUF - r.inversionInicialUF,
        5,
      );
    }
  });

  it('cuenta el bono pie completo cuando sí rebaja el desembolso', () => {
    // Con 80% el pie es 20%: el crédito directo (10%) y el bono (5%) caben.
    const r = computeCashflow(
      cashflowBase({ quote: quoteBase({ ltv: 0.8, bonoPiePct: 0.05 }) }),
    );
    for (const p of r.proyeccion) {
      expect(p.bonoPieAplicadoUF).toBeCloseTo(3660.66 * 0.05, 5);
    }
  });

  it('no cuenta el bono pie que el crédito directo ya dejó sin uso', () => {
    // Con 90% el pie es 10%, que el crédito directo cubre entero: el bono sobra.
    const quote = quoteBase({ ltv: 0.9, bonoPiePct: 0.05 });
    expect(quote.aporteEfectivoUF).toBe(0);
    const r = computeCashflow(cashflowBase({ quote }));
    for (const p of r.proyeccion) {
      expect(p.bonoPieAplicadoUF).toBeCloseTo(0, 5);
    }
  });

  it('las partes siempre suman el total', () => {
    for (const ltv of [0.8, 0.9]) {
      for (const bono of [0, 0.03, 0.05, 0.1]) {
        const r = computeCashflow(
          cashflowBase({ quote: quoteBase({ ltv, bonoPiePct: bono }) }),
        );
        for (const p of r.proyeccion) {
          expect(p.gananciaTotalUF).toBeCloseTo(
            p.plusvaliaUF +
              p.amortizacionUF +
              p.flujoAcumuladoUF +
              p.bonoPieAplicadoUF -
              p.gastosCompraUF,
            5,
          );
        }
      }
    }
  });

  it('la ganancia crece con el horizonte', () => {
    const r = computeCashflow(cashflowBase());
    expect(r.proyeccion[1].gananciaTotalUF).toBeGreaterThan(r.proyeccion[0].gananciaTotalUF);
    expect(r.proyeccion[2].gananciaTotalUF).toBeGreaterThan(r.proyeccion[1].gananciaTotalUF);
  });

  it('con plusvalía 0 la ganancia viene sólo de amortización y flujo', () => {
    const cfg: CashflowConfig = { ...config.cashflow, plusvaliaAnual: 0 };
    const r = computeCashflow(cashflowBase({ config: cfg }));
    for (const p of r.proyeccion) {
      expect(p.plusvaliaUF).toBeCloseTo(0, 6);
      expect(p.gananciaTotalUF).toBeCloseTo(
        p.amortizacionUF + p.flujoAcumuladoUF + p.bonoPieAplicadoUF - p.gastosCompraUF,
        5,
      );
    }
  });

  it('el retorno sobre inversión usa la inversión inicial como base', () => {
    const r = computeCashflow(cashflowBase());
    for (const p of r.proyeccion) {
      expect(p.retornoSobreInversion).toBeCloseTo(p.gananciaTotalUF / r.inversionInicialUF, 8);
    }
  });

  it('la TIR anula el VAN de la serie de flujos', () => {
    const r = computeCashflow(cashflowBase());
    const p = r.proyeccion[2];
    const tirMensual = Math.pow(1 + p.tirAnual!, 1 / 12) - 1;
    const flujos = [-r.inversionInicialUF];
    for (let m = 1; m <= 120; m++) {
      flujos.push(m <= r.mesesEtapa1 ? r.mensual.etapa1.flujoNetoUF : r.mensual.etapa2.flujoNetoUF);
    }
    flujos[flujos.length - 1] += p.patrimonioUF;
    const van = flujos.reduce((a, f, t) => a + f / Math.pow(1 + tirMensual, t), 0);
    expect(van / r.inversionInicialUF).toBeCloseTo(0, 4);
  });

  it('los costos de operación reducen la ganancia', () => {
    const sinCostos = computeCashflow(cashflowBase());
    const conCostos = computeCashflow(
      cashflowBase({
        config: { ...config.cashflow, gastosComunesCLP: 80_000, administracionPct: 0.1 },
      }),
    );
    expect(conCostos.proyeccion[2].gananciaTotalUF).toBeLessThan(
      sinCostos.proyeccion[2].gananciaTotalUF,
    );
  });
});

describe('computeCashflow — casos límite', () => {
  it('avisa y no explota si falta el valor de la UF', () => {
    const r = computeCashflow(cashflowBase({ quote: quoteBase({ ufValue: 0 }) }));
    expect(r.warnings.join(' ')).toMatch(/valor de UF/i);
    expect(Number.isFinite(r.proyeccion[0].gananciaTotalUF)).toBe(true);
  });

  it('funciona sin arriendo ingresado', () => {
    const r = computeCashflow(cashflowBase({ quote: quoteBase({ arriendoCLP: null }) }));
    expect(r.mensual.etapa1.arriendoBrutoUF).toBe(0);
    expect(Number.isFinite(r.proyeccion[0].gananciaTotalUF)).toBe(true);
  });

  it('usa la tasa hipotecaria del escenario elegido', () => {
    const barata = computeCashflow(cashflowBase({ tasaAnual: 0.032 }));
    const cara = computeCashflow(cashflowBase({ tasaAnual: 0.045 }));
    expect(cara.mensual.etapa1.dividendoUF).toBeGreaterThan(barata.mensual.etapa1.dividendoUF);
    expect(cara.proyeccion[2].gananciaTotalUF).toBeLessThan(
      barata.proyeccion[2].gananciaTotalUF,
    );
  });

  it('respeta la convención de tasa del proyecto', () => {
    const r = computeCashflow(cashflowBase());
    const esperada = monthlyRate(0.032, 'efectivaAnual');
    const saldoEsperado = saldoInsoluto(
      quoteBase().creditoHipotecarioUF,
      esperada,
      360,
      36,
    );
    expect(r.proyeccion[0].saldoHipotecarioUF).toBeCloseTo(saldoEsperado, 6);
  });
});
