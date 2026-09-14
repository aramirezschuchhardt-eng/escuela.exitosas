import { describe, expect, it } from 'vitest';
import {
  annuityPayment,
  baseSugerida,
  basesDisponibles,
  computeEscenarios,
  computeQuote,
  monthlyRate,
  resolvePricing,
  type QuoteInput,
} from './finance';
import type { ProjectConfig } from './types';

const config: ProjectConfig = {
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
  convencionTasa: 'nominalAnual',
  iva: {
    enabled: true,
    minPct: 0.1,
    maxPct: 0.15,
    defaultPct: 0.1,
    base: 'precioConDescuento',
    aplicarAlFinanciamiento: false,
  },
  arriendo: { minCLP: 300_000, maxCLP: 500_000, stepCLP: 10_000, defaultCLP: null },
};

/** UF ficticia = 1 para poder razonar el ejemplo del encargo directamente en pesos. */
const baseInput = (over: Partial<QuoteInput> = {}): QuoteInput => ({
  pricing: resolvePricing({
    precioListaUF: 100_000_000,
    descuentoPct: null,
    descuentoMontoUF: null,
    precioConDescuentoUF: null,
  }),
  config,
  ufValue: 1,
  bonoPiePct: 0,
  ltv: 0.8,
  creditoDirectoPct: 0.1,
  creditoDirectoCuotas: 60,
  plazoAnios: 30,
  arriendoCLP: 400_000,
  ivaPct: 0.1,
  ...over,
});

describe('resolvePricing — precio y descuento sin duplicar', () => {
  it('usa el precio con descuento de la planilla cuando existe', () => {
    const p = resolvePricing({
      precioListaUF: 3000,
      descuentoPct: 0.05,
      descuentoMontoUF: null,
      precioConDescuentoUF: 2850,
    });
    expect(p.precioConDescuentoUF).toBe(2850);
    expect(p.descuentoMontoUF).toBeCloseTo(150, 6);
    expect(p.descuentoPct).toBeCloseTo(0.05, 6);
    expect(p.fuente).toBe('planilla');
    expect(p.warnings).toHaveLength(0);
  });

  it('advierte cuando el descuento declarado no calza con el precio final', () => {
    const p = resolvePricing({
      precioListaUF: 3000,
      descuentoPct: 0.1, // implicaría 2700, pero la planilla dice 2850
      descuentoMontoUF: null,
      precioConDescuentoUF: 2850,
    });
    expect(p.precioConDescuentoUF).toBe(2850); // manda la planilla
    expect(p.warnings.join(' ')).toMatch(/Inconsistencia/);
  });

  it('aplica sólo el monto cuando vienen monto y porcentaje (no duplica)', () => {
    const p = resolvePricing({
      precioListaUF: 3000,
      descuentoPct: 0.05,
      descuentoMontoUF: 150,
      precioConDescuentoUF: null,
    });
    expect(p.precioConDescuentoUF).toBe(2850);
    expect(p.warnings.join(' ')).toMatch(/no duplicar/);
  });

  it('calcula por porcentaje cuando sólo hay porcentaje', () => {
    const p = resolvePricing({
      precioListaUF: 2000,
      descuentoPct: 0.08,
      descuentoMontoUF: null,
      precioConDescuentoUF: null,
    });
    expect(p.precioConDescuentoUF).toBeCloseTo(1840, 6);
    expect(p.fuente).toBe('calculado');
  });

  it('deja precio con descuento = precio lista si no hay descuento', () => {
    const p = resolvePricing({
      precioListaUF: 2000,
      descuentoPct: null,
      descuentoMontoUF: null,
      precioConDescuentoUF: null,
    });
    expect(p.precioConDescuentoUF).toBe(2000);
    expect(p.descuentoMontoUF).toBe(0);
    expect(p.fuente).toBe('sin-descuento');
  });

  it('marca las unidades sin precio en lugar de inventar uno', () => {
    const p = resolvePricing({
      precioListaUF: null,
      descuentoPct: null,
      descuentoMontoUF: null,
      precioConDescuentoUF: null,
    });
    expect(p.precioConDescuentoUF).toBeNull();
    expect(p.fuente).toBe('sin-precio');
    expect(p.warnings).toHaveLength(1);
  });
});

describe('annuityPayment — cuota fija', () => {
  it('divide linealmente cuando la tasa es 0', () => {
    expect(annuityPayment(10_000_000, 0, 60)).toBeCloseTo(166_666.667, 3);
  });

  it('calcula la anualidad estándar', () => {
    // P=100.000, i=0,5% mensual, n=360 → 599,55
    expect(annuityPayment(100_000, 0.005, 360)).toBeCloseTo(599.55, 2);
  });

  it('es coherente con la amortización completa del capital', () => {
    const P = 5000;
    const i = 0.004;
    const n = 240;
    const cuota = annuityPayment(P, i, n);
    let saldo = P;
    for (let k = 0; k < n; k++) saldo = saldo * (1 + i) - cuota;
    expect(saldo).toBeCloseTo(0, 6);
  });

  it('devuelve 0 para capital o plazo nulos', () => {
    expect(annuityPayment(0, 0.005, 360)).toBe(0);
    expect(annuityPayment(1000, 0.005, 0)).toBe(0);
  });
});

describe('monthlyRate — convenciones de tasa', () => {
  it('nominal anual divide por 12', () => {
    expect(monthlyRate(0.048, 'nominalAnual')).toBeCloseTo(0.004, 10);
  });
  it('efectiva anual usa la raíz duodécima', () => {
    expect(monthlyRate(0.045, 'efectivaAnual')).toBeCloseTo(Math.pow(1.045, 1 / 12) - 1, 12);
  });
  it('tasa 0 es 0 en ambas convenciones', () => {
    expect(monthlyRate(0, 'efectivaAnual')).toBe(0);
    expect(monthlyRate(0, 'nominalAnual')).toBe(0);
  });
});

describe('computeQuote — ejemplo del encargo (propiedad de $100.000.000)', () => {
  it('crédito directo 10% en 60 cuotas sin interés = $166.667', () => {
    const r = computeQuote(baseInput());
    expect(r.creditoDirectoUF).toBeCloseTo(10_000_000, 6);
    expect(r.cuotaCreditoDirectoCLP).toBeCloseTo(166_666.667, 2);
  });

  it('financiamiento 80%: crédito 80%, pie total 20%', () => {
    const r = computeQuote(baseInput());
    expect(r.creditoHipotecarioUF).toBeCloseTo(80_000_000, 6);
    expect(r.pieTotalUF).toBeCloseTo(20_000_000, 6);
  });

  it('el aporte efectivo descuenta bono pie y crédito directo del pie total', () => {
    const r = computeQuote(baseInput({ bonoPiePct: 0.05 }));
    // pie 20.000.000 − CD 10.000.000 − bono 5.000.000 = 5.000.000
    expect(r.aporteEfectivoUF).toBeCloseTo(5_000_000, 6);
  });

  it('nunca deja aporte efectivo negativo y avisa', () => {
    const r = computeQuote(baseInput({ ltv: 0.9, bonoPiePct: 0.1, creditoDirectoPct: 0.1 }));
    expect(r.aporteEfectivoUF).toBe(0);
    expect(r.warnings.join(' ')).toMatch(/superan el pie requerido/);
  });

  it('separa el desembolso en dos etapas', () => {
    const r = computeQuote(baseInput());
    const esc = r.dividendos[0];
    expect(esc.desembolsoEtapa1CLP).toBeCloseTo(esc.dividendoCLP + 166_666.667, 2);
    expect(esc.desembolsoEtapa2CLP).toBeCloseTo(esc.dividendoCLP, 6);
    expect(esc.desembolsoEtapa1CLP - esc.desembolsoEtapa2CLP).toBeCloseTo(166_666.667, 2);
  });

  it('el flujo mensual es arriendo menos desembolso, en ambas etapas', () => {
    const r = computeQuote(baseInput({ arriendoCLP: 400_000 }));
    const esc = r.dividendos[0];
    expect(esc.flujoEtapa1CLP).toBeCloseTo(400_000 - esc.desembolsoEtapa1CLP, 6);
    expect(esc.flujoEtapa2CLP).toBeCloseTo(400_000 - esc.dividendoCLP, 6);
    expect(esc.flujoEtapa2CLP! - esc.flujoEtapa1CLP!).toBeCloseTo(166_666.667, 2);
  });

  it('reproduce el ejemplo del encargo con dividendo de $350.000', () => {
    // Se busca el crédito que produce exactamente $350.000 de dividendo y se
    // verifica la cadena completa: 350.000 + 166.667 = 516.667, flujo −116.667 / +50.000.
    const r = computeQuote(baseInput());
    const esc = r.dividendos[0];
    const escalado = 350_000 / esc.dividendoCLP;
    const dividendo = esc.dividendoCLP * escalado;
    const desembolso1 = dividendo + r.cuotaCreditoDirectoCLP;
    expect(dividendo).toBeCloseTo(350_000, 6);
    expect(desembolso1).toBeCloseTo(516_666.667, 2);
    expect(400_000 - desembolso1).toBeCloseTo(-116_666.667, 2);
    expect(400_000 - dividendo).toBeCloseTo(50_000, 6);
  });

  it('entrega las tres tasas configuradas simultáneamente y ordenadas por costo', () => {
    const r = computeQuote(baseInput());
    expect(r.dividendos.map((d) => d.tasaAnual)).toEqual([0.032, 0.04, 0.045]);
    expect(r.dividendos[0].dividendoCLP).toBeLessThan(r.dividendos[1].dividendoCLP);
    expect(r.dividendos[1].dividendoCLP).toBeLessThan(r.dividendos[2].dividendoCLP);
  });

  it('calcula rentabilidad bruta anual sobre el precio considerado', () => {
    const r = computeQuote(baseInput({ arriendoCLP: 400_000 }));
    expect(r.arriendoAnualCLP).toBe(4_800_000);
    expect(r.rentabilidadBrutaAnual).toBeCloseTo(4_800_000 / 100_000_000, 10);
  });

  it('deja el arriendo y la rentabilidad en null si el broker no lo ingresa', () => {
    const r = computeQuote(baseInput({ arriendoCLP: null }));
    expect(r.arriendoAnualCLP).toBeNull();
    expect(r.rentabilidadBrutaAnual).toBeNull();
    expect(r.dividendos[0].flujoEtapa1CLP).toBeNull();
  });
});

describe('computeQuote — topes y condiciones por proyecto', () => {
  it('limita el crédito directo al tope del proyecto', () => {
    const r = computeQuote(baseInput({ creditoDirectoPct: 0.25 }));
    expect(r.creditoDirectoPct).toBeCloseTo(0.1, 10);
    expect(r.warnings.join(' ')).toMatch(/se limitó/);
  });

  it('limita el crédito directo al pie total disponible (caso 90%)', () => {
    const r = computeQuote(baseInput({ ltv: 0.9, creditoDirectoPct: 0.1 }));
    // pie total es 10%, así que el crédito directo no puede pasar de 10%
    expect(r.creditoDirectoUF).toBeCloseTo(10_000_000, 6);
    expect(r.aporteEfectivoUF).toBe(0);
  });

  it('ignora el bono pie si el proyecto no lo ofrece', () => {
    const sinBono = { ...config, bonoPie: { ...config.bonoPie, enabled: false } };
    const r = computeQuote(baseInput({ config: sinBono, bonoPiePct: 0.1 }));
    expect(r.bonoPiePct).toBe(0);
    expect(r.bonoPieUF).toBe(0);
  });

  it('ignora el crédito directo si el proyecto no lo ofrece', () => {
    const sinCd = {
      ...config,
      creditoDirecto: { ...config.creditoDirecto, enabled: false },
    };
    const r = computeQuote(baseInput({ config: sinCd, creditoDirectoPct: 0.1 }));
    expect(r.creditoDirectoUF).toBe(0);
    expect(r.cuotaCreditoDirectoCLP).toBe(0);
    expect(r.dividendos[0].desembolsoEtapa1CLP).toBeCloseTo(
      r.dividendos[0].desembolsoEtapa2CLP,
      6,
    );
  });

  it('respeta una tasa de crédito directo distinta de 0 si se configura', () => {
    const conInteres = {
      ...config,
      creditoDirecto: { ...config.creditoDirecto, tasaAnual: 0.12 },
    };
    const r = computeQuote(baseInput({ config: conInteres }));
    expect(r.cuotaCreditoDirectoCLP).toBeGreaterThan(166_666.667);
  });
});

describe('computeQuote — devolución de IVA', () => {
  it('no descuenta el IVA del monto financiado por defecto', () => {
    const r = computeQuote(baseInput({ ivaPct: 0.15 }));
    expect(r.precioConsideradoUF).toBeCloseTo(100_000_000, 6);
    expect(r.creditoHipotecarioUF).toBeCloseTo(80_000_000, 6);
    expect(r.ivaMontoUF).toBeCloseTo(15_000_000, 6);
    expect(r.valorEfectivoPostIvaUF).toBeCloseTo(85_000_000, 6);
  });

  it('sí lo descuenta cuando el proyecto está configurado para ello', () => {
    const cfg = { ...config, iva: { ...config.iva, aplicarAlFinanciamiento: true } };
    const r = computeQuote(baseInput({ config: cfg, ivaPct: 0.1 }));
    expect(r.precioConsideradoUF).toBeCloseTo(90_000_000, 6);
    expect(r.creditoHipotecarioUF).toBeCloseTo(72_000_000, 6);
  });

  it('acota el porcentaje al rango configurado', () => {
    const r = computeQuote(baseInput({ ivaPct: 0.9 }));
    expect(r.ivaPct).toBeCloseTo(0.15, 10);
  });

  it('queda en cero si el proyecto no tiene devolución de IVA', () => {
    const cfg = { ...config, iva: { ...config.iva, enabled: false } };
    const r = computeQuote(baseInput({ config: cfg }));
    expect(r.ivaMontoUF).toBe(0);
    expect(r.ivaAplica).toBe(false);
  });
});

describe('computeQuote — conversión UF/CLP', () => {
  it('convierte los montos mensuales con el valor de UF configurado', () => {
    const pricing = resolvePricing({
      precioListaUF: 3000,
      descuentoPct: null,
      descuentoMontoUF: null,
      precioConDescuentoUF: null,
    });
    const uf = 39_000;
    const r = computeQuote(baseInput({ pricing, ufValue: uf }));
    expect(r.precioConsideradoCLP).toBeCloseTo(3000 * uf, 4);
    expect(r.creditoHipotecarioCLP).toBeCloseTo(r.creditoHipotecarioUF * uf, 4);
    expect(r.dividendos[0].dividendoCLP).toBeCloseTo(r.dividendos[0].dividendoUF * uf, 4);
  });
});

describe('computeEscenarios', () => {
  it('recalcula cada escenario con su propio LTV', () => {
    const escenarios = computeEscenarios(baseInput(), [
      { nombre: 'E1', ltv: 0.9, tasaAnual: 0.032, usarCreditoDirecto: false },
      { nombre: 'E2', ltv: 0.8, tasaAnual: 0.04, usarCreditoDirecto: true },
      { nombre: 'E3', ltv: 0.8, tasaAnual: 0.045, usarCreditoDirecto: true },
    ]);
    expect(escenarios[0].quote.creditoHipotecarioUF).toBeCloseTo(90_000_000, 6);
    expect(escenarios[0].quote.creditoDirectoUF).toBe(0);
    expect(escenarios[1].quote.creditoHipotecarioUF).toBeCloseTo(80_000_000, 6);
    expect(escenarios[1].dividendo!.tasaAnual).toBe(0.04);
    expect(escenarios[2].dividendo!.dividendoCLP).toBeGreaterThan(
      escenarios[1].dividendo!.dividendoCLP,
    );
  });

  it('marca como no disponible un LTV que el proyecto no ofrece', () => {
    const cfg = { ...config, financiamiento: [0.8], financiamientoDefault: 0.8 };
    const escenarios = computeEscenarios(baseInput({ config: cfg }), [
      { nombre: 'E1', ltv: 0.9, tasaAnual: 0.032, usarCreditoDirecto: false },
    ]);
    expect(escenarios[0].disponible).toBe(false);
    expect(escenarios[0].quote.ltv).toBe(0.8);
  });

  it('calcula una tasa fuera de la lista configurada para poder comparar', () => {
    const escenarios = computeEscenarios(baseInput(), [
      { nombre: 'E1', ltv: 0.8, tasaAnual: 0.06, usarCreditoDirecto: false },
    ]);
    expect(escenarios[0].dividendo!.tasaAnual).toBe(0.06);
    expect(escenarios[0].dividendo!.dividendoCLP).toBeGreaterThan(0);
  });
});


/* ──────────────────────────────────────────────────────────────────────────
 * Adicionales (estacionamiento/bodega) y bases alternativas de cotización
 * ────────────────────────────────────────────────────────────────────────── */

describe('resolvePricing — adicionales y bases de cotización', () => {
  /** Caso real de la planilla: depto 209, 2D+2B con estacionamiento. */
  const unidad209 = () =>
    resolvePricing({
      precioListaUF: 3888,
      descuentoPct: 0.1,
      descuentoMontoUF: null,
      precioConDescuentoUF: 3499.2,
      precioAdicionalesUF: 350,
      precioNegocioFinalUF: 3849.2,
      aporteInmobiliarioPct: 0.15,
      precioAporteInmobiliarioUF: 4528.47,
    });

  it('reproduce el precio negocio final de la planilla', () => {
    const p = unidad209();
    expect(p.precioConDescuentoUF).toBe(3499.2);
    expect(p.adicionalesUF).toBe(350);
    expect(p.precioNegocioFinalUF).toBe(3849.2);
    expect(p.warnings).toHaveLength(0);
  });

  it('calcula el precio negocio final cuando la planilla no lo trae', () => {
    const p = resolvePricing({
      precioListaUF: 3888,
      descuentoPct: 0.1,
      descuentoMontoUF: null,
      precioConDescuentoUF: 3499.2,
      precioAdicionalesUF: 350,
      precioNegocioFinalUF: null,
    });
    expect(p.precioNegocioFinalUF).toBeCloseTo(3849.2, 6);
  });

  it('advierte si el precio negocio final de la planilla no calza', () => {
    const p = resolvePricing({
      precioListaUF: 3888,
      descuentoPct: 0.1,
      descuentoMontoUF: null,
      precioConDescuentoUF: 3499.2,
      precioAdicionalesUF: 350,
      precioNegocioFinalUF: 4000,
    });
    expect(p.precioNegocioFinalUF).toBe(4000); // manda la planilla
    expect(p.warnings.join(' ')).toMatch(/negocio final/);
  });

  it('deriva la tasa de aporte inmobiliario cuando no viene declarada', () => {
    const p = resolvePricing({
      precioListaUF: 3888,
      descuentoPct: 0.1,
      descuentoMontoUF: null,
      precioConDescuentoUF: 3499.2,
      precioAdicionalesUF: 350,
      precioNegocioFinalUF: 3849.2,
      aporteInmobiliarioPct: null,
      precioAporteInmobiliarioUF: 4528.47,
    });
    expect(p.aporteInmobiliarioPct).toBeCloseTo(0.15, 4);
  });

  it('lista sólo las bases realmente disponibles', () => {
    expect(basesDisponibles(unidad209())).toEqual(['departamento', 'negocio', 'aporte']);
    const sinAdicionales = resolvePricing({
      precioListaUF: 3000,
      descuentoPct: 0.05,
      descuentoMontoUF: null,
      precioConDescuentoUF: 2850,
    });
    expect(basesDisponibles(sinAdicionales)).toEqual(['departamento']);
  });

  it('sugiere el precio negocio final sólo si hay adicionales', () => {
    expect(baseSugerida(unidad209())).toBe('negocio');
    const sinAdicionales = resolvePricing({
      precioListaUF: 3000,
      descuentoPct: null,
      descuentoMontoUF: null,
      precioConDescuentoUF: null,
    });
    expect(baseSugerida(sinAdicionales)).toBe('departamento');
  });
});

describe('computeQuote — base de cotización', () => {
  const pricing = resolvePricing({
    precioListaUF: 3888,
    descuentoPct: 0.1,
    descuentoMontoUF: null,
    precioConDescuentoUF: 3499.2,
    precioAdicionalesUF: 350,
    precioNegocioFinalUF: 3849.2,
    aporteInmobiliarioPct: 0.15,
    precioAporteInmobiliarioUF: 4528.47,
  });

  it('financia sólo el departamento con la base "departamento"', () => {
    const r = computeQuote(baseInput({ pricing, base: 'departamento', ltv: 0.9 }));
    expect(r.precioBaseUF).toBe(3499.2);
    expect(r.creditoHipotecarioUF).toBeCloseTo(3499.2 * 0.9, 6);
  });

  it('incluye el estacionamiento con la base "negocio"', () => {
    const r = computeQuote(baseInput({ pricing, base: 'negocio', ltv: 0.9 }));
    expect(r.precioBaseUF).toBe(3849.2);
    expect(r.creditoHipotecarioUF).toBeCloseTo(3849.2 * 0.9, 6);
  });

  it('usa el precio de aporte inmobiliario con la base "aporte"', () => {
    const r = computeQuote(baseInput({ pricing, base: 'aporte', ltv: 0.9 }));
    expect(r.precioBaseUF).toBe(4528.47);
  });

  it('cae a la base del departamento y avisa si la base pedida no existe', () => {
    const simple = resolvePricing({
      precioListaUF: 3000,
      descuentoPct: null,
      descuentoMontoUF: null,
      precioConDescuentoUF: null,
    });
    const r = computeQuote(baseInput({ pricing: simple, base: 'aporte' }));
    expect(r.base).toBe('departamento');
    expect(r.precioBaseUF).toBe(3000);
    expect(r.warnings.join(' ')).toMatch(/no trae/);
  });

  it('la devolución de IVA se calcula sobre la base elegida', () => {
    const r = computeQuote(baseInput({ pricing, base: 'negocio', ivaPct: 0.1 }));
    expect(r.valorEfectivoPostIvaUF).toBeCloseTo(3849.2 - r.ivaMontoUF, 6);
  });
});
