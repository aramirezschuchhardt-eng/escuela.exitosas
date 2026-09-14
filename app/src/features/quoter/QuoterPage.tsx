import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../data/store';
import {
  baseSugerida,
  computeEscenarios,
  computeQuote,
  pricingFromUnit,
  type QuoteInput,
} from '../../domain/finance';
import { cashflowParamsFrom, computeCashflow, mergeCashflowConfig } from '../../domain/cashflow';
import { isCotizable } from '../../domain/units';
import { formatCLP, formatCLPSigned, formatPct, formatUF } from '../../domain/money';
import type { Project, QuoteParams, Unit } from '../../domain/types';
import { Card, Empty, Note, Stat, Warnings } from '../../components/ui';
import { quoteUrl } from '../../lib/share';
import UnitPicker from './UnitPicker';
import {
  ArriendoYFlujo,
  AvisoUF,
  BonoPie,
  CashflowMensual,
  ProyeccionPlusvalia,
  SupuestosCashflow,
  ComparadorEscenarios,
  CostoMensualTotal,
  CreditoDirecto,
  DevolucionIva,
  Financiamiento,
  PrecioYDescuento,
  ResumenInversion,
  SimuladorDividendo,
  UnidadSeleccionada,
} from './QuoterSections';

const PASOS = [
  'Unidad',
  'Precio',
  'Bono pie',
  'Financiamiento',
  'Crédito directo',
  'Dividendo',
  'Arriendo',
  'Flujo',
  'Resumen',
];

/** Estado inicial del cotizador según la configuración del proyecto. */
function initialParams(project: Project, unit: Unit | null): QuoteParams {
  const c = project.config;
  return {
    projectId: project.id,
    unitId: unit?.id ?? '',
    // Si la unidad trae estacionamiento o bodega, se cotiza el precio negocio final.
    base: unit ? baseSugerida(pricingFromUnit(unit)) : 'departamento',
    bonoPiePct: c.bonoPie.enabled ? (unit?.bonoPiePct ?? c.bonoPie.defaultPct) : 0,
    ltv: c.financiamientoDefault,
    creditoDirectoPct: c.creditoDirecto.enabled ? c.creditoDirecto.defaultPct : 0,
    creditoDirectoCuotas: c.creditoDirecto.defaultPlazo,
    plazoAnios: c.plazoDefaultAnios,
    arriendoCLP: c.arriendo.defaultCLP,
    ivaPct: c.iva.enabled ? c.iva.defaultPct : 0,
    cashflow: cashflowParamsFrom(c.cashflow),
  };
}

export default function QuoterPage() {
  const { projectId, unitId } = useParams();
  const navigate = useNavigate();
  const { getProject, unitsOf, settings } = useStore();

  const project = projectId ? getProject(projectId) : undefined;
  const units = useMemo(() => (projectId ? unitsOf(projectId) : []), [projectId, unitsOf]);
  const unidadInicial = unitId ? (units.find((u) => u.id === unitId) ?? null) : null;

  const [params, setParams] = useState<QuoteParams | null>(null);
  const [tasaSeleccionada, setTasaSeleccionada] = useState<number | null>(null);
  const [eligiendo, setEligiendo] = useState(!unidadInicial);

  /*
   * Al cambiar el proyecto o la unidad de la URL hay que reiniciar los parámetros
   * del cotizador. Se hace ajustando el estado durante el render (comparando
   * contra la ruta anterior) en lugar de con un efecto: así la primera pintura ya
   * lleva los valores correctos y no se renderiza un fotograma intermedio.
   */
  const rutaActual = `${project?.id ?? ''}/${unidadInicial?.id ?? ''}`;
  const [rutaPrevia, setRutaPrevia] = useState<string | null>(null);
  if (project && rutaActual !== rutaPrevia) {
    setRutaPrevia(rutaActual);
    setParams(initialParams(project, unidadInicial));
    setTasaSeleccionada(project.config.tasas[0] ?? null);
    setEligiendo(!unidadInicial);
  }

  const unitIdActual = params?.unitId ?? null;
  const unit = useMemo(
    () => (unitIdActual ? (units.find((u) => u.id === unitIdActual) ?? null) : null),
    [unitIdActual, units],
  );

  const ufValue = settings?.ufValue ?? 0;

  const quoteInput: QuoteInput | null = useMemo(() => {
    if (!project || !unit || !params) return null;
    return {
      pricing: pricingFromUnit(unit),
      base: params.base,
      config: project.config,
      ufValue,
      bonoPiePct: params.bonoPiePct,
      ltv: params.ltv,
      creditoDirectoPct: params.creditoDirectoPct,
      creditoDirectoCuotas: params.creditoDirectoCuotas,
      plazoAnios: params.plazoAnios,
      arriendoCLP: params.arriendoCLP,
      ivaPct: params.ivaPct,
    };
  }, [project, unit, params, ufValue]);

  const quote = useMemo(() => (quoteInput ? computeQuote(quoteInput) : null), [quoteInput]);

  const cashflow = useMemo(() => {
    if (!quote || !project || !params) return null;
    return computeCashflow({
      quote,
      config: mergeCashflowConfig(project.config.cashflow, params.cashflow),
      tasaAnual: tasaSeleccionada ?? project.config.tasas[0] ?? 0,
      estacionamientos: [unit?.estacionamiento, unit?.estacionamiento2].filter(Boolean).length,
    });
  }, [quote, project, params, tasaSeleccionada, unit]);

  const escenarios = useMemo(() => {
    if (!quoteInput || !project) return [];
    const tasas = project.config.tasas;
    const tieneCd = project.config.creditoDirecto.enabled;
    const ltvAlto = project.config.financiamiento.includes(0.9) ? 0.9 : project.config.financiamientoDefault;
    const ltvBajo = project.config.financiamiento.includes(0.8) ? 0.8 : project.config.financiamientoDefault;
    return computeEscenarios(quoteInput, [
      {
        nombre: 'Escenario 1',
        ltv: ltvAlto,
        tasaAnual: tasas[0] ?? 0.032,
        usarCreditoDirecto: false,
      },
      {
        nombre: 'Escenario 2',
        ltv: ltvBajo,
        tasaAnual: tasas[1] ?? 0.04,
        usarCreditoDirecto: tieneCd,
      },
      {
        nombre: 'Escenario 3',
        ltv: ltvBajo,
        tasaAnual: tasas[2] ?? 0.045,
        usarCreditoDirecto: tieneCd,
      },
    ]);
  }, [quoteInput, project]);

  if (!project) {
    return (
      <div className="container section">
        <Empty titulo="Proyecto no encontrado" accion={<Link className="btn btn-primary" to="/">Ir al catálogo</Link>}>
          El proyecto solicitado no existe.
        </Empty>
      </div>
    );
  }

  const set = <K extends keyof QuoteParams>(key: K, value: QuoteParams[K]) =>
    setParams((p) => (p ? { ...p, [key]: value } : p));

  const seleccionar = (u: Unit) => {
    setParams((p) =>
      p
        ? {
            ...p,
            unitId: u.id,
            base: baseSugerida(pricingFromUnit(u)),
            bonoPiePct: u.bonoPiePct ?? p.bonoPiePct,
          }
        : p,
    );
    setEligiendo(false);
    navigate(`/cotizar/${project.id}/${u.id}`, { replace: true });
  };

  const tasaActiva = tasaSeleccionada ?? project.config.tasas[0] ?? 0;
  const pasoActual = !unit ? 0 : params?.arriendoCLP != null ? 8 : 5;

  return (
    <div className="container section stack stack-lg">
      <div className="no-print row-between">
        <Link to={`/proyecto/${project.id}`} className="btn btn-ghost btn-sm" style={{ marginLeft: -11 }}>
          ← {project.nombre}
        </Link>
      </div>

      <header className="stack stack-sm">
        <p className="eyebrow">Cotizador</p>
        <h1 className="step-title">{project.nombre}</h1>
        <div className="flow-rail no-print">
          {PASOS.map((p, i) => (
            <span
              key={p}
              className={`flow-step${i === pasoActual ? ' is-active' : i < pasoActual ? ' is-done' : ''}`}
            >
              {i + 1}. {p}
            </span>
          ))}
        </div>
      </header>

      <AvisoUF ufValue={ufValue} />

      {eligiendo || !unit || !quote || !params ? (
        <Card
          title="Seleccione una unidad"
          desc="El stock, los precios y los estados provienen de la planilla importada."
        >
          <UnitPicker
            project={project}
            units={units}
            selectedId={params?.unitId ?? null}
            onSelect={seleccionar}
          />
        </Card>
      ) : (
        <div className="quoter-layout">
          <div className="stack stack-md">
            <Warnings items={quote.warnings} />

            <UnidadSeleccionada project={project} unit={unit} onCambiar={() => setEligiendo(true)} />
            <PrecioYDescuento
              quote={quote}
              base={params.base}
              onBase={(b) => set('base', b)}
            />
            <BonoPie
              project={project}
              quote={quote}
              valor={params.bonoPiePct}
              onChange={(v) => set('bonoPiePct', v)}
            />
            <Financiamiento
              project={project}
              quote={quote}
              ltv={params.ltv}
              onLtv={(v) => set('ltv', v)}
            />
            <CreditoDirecto
              project={project}
              quote={quote}
              pct={params.creditoDirectoPct}
              cuotas={params.creditoDirectoCuotas}
              onPct={(v) => set('creditoDirectoPct', v)}
              onCuotas={(v) => set('creditoDirectoCuotas', v)}
            />
            <SimuladorDividendo
              project={project}
              quote={quote}
              plazo={params.plazoAnios}
              onPlazo={(v) => set('plazoAnios', v)}
              ltv={params.ltv}
              onLtv={(v) => set('ltv', v)}
            />
            <CostoMensualTotal
              quote={quote}
              tasaSeleccionada={tasaActiva}
              onTasa={setTasaSeleccionada}
            />
            <ArriendoYFlujo
              project={project}
              quote={quote}
              arriendo={params.arriendoCLP}
              onArriendo={(v) => set('arriendoCLP', v)}
              tasaSeleccionada={tasaActiva}
            />
            <DevolucionIva
              project={project}
              quote={quote}
              pct={params.ivaPct}
              onPct={(v) => set('ivaPct', v)}
            />

            {cashflow && (
              <>
                <Card
                  title="Supuestos del cash flow"
                  desc="Ajuste los costos y la plusvalía según el caso del cliente."
                >
                  <SupuestosCashflow
                    params={params.cashflow}
                    onChange={(v) => set('cashflow', v)}
                  />
                </Card>
                <CashflowMensual cashflow={cashflow} tasaAnual={tasaActiva} />
                <ProyeccionPlusvalia cashflow={cashflow} tasaAnual={tasaActiva} />
              </>
            )}
            <ResumenInversion
              project={project}
              unit={unit}
              quote={quote}
              tasaSeleccionada={tasaActiva}
            />
            <ComparadorEscenarios escenarios={escenarios} />

            <p className="disclaimer">{settings?.disclaimer}</p>
          </div>

          <aside className="quoter-aside no-print">
            <Card title="Resumen rápido">
              <div className="stack stack-sm">
                <Stat
                  label="Precio con descuento"
                  value={formatUF(quote.pricing.precioConDescuentoUF)}
                  sub={ufValue > 0 ? formatCLP(quote.precioConsideradoCLP) : 'UF sin configurar'}
                  tone="dark"
                  size="lg"
                />
                <div className="grid grid-2">
                  <Stat label="Financiamiento" value={formatPct(quote.ltv, 0)} />
                  <Stat label="Aporte efectivo" value={formatUF(quote.aporteEfectivoUF)} />
                </div>
                <div className="grid grid-2">
                  <Stat
                    label={`Dividendo ${formatPct(tasaActiva)}`}
                    value={formatCLP(
                      quote.dividendos.find((d) => Math.abs(d.tasaAnual - tasaActiva) < 1e-9)
                        ?.dividendoCLP ?? null,
                    )}
                  />
                  <Stat
                    label="Cuota crédito directo"
                    value={
                      quote.cuotaCreditoDirectoCLP > 0
                        ? formatCLP(quote.cuotaCreditoDirectoCLP)
                        : '—'
                    }
                  />
                </div>
                {quote.arriendoCLP != null && (
                  <Stat
                    label="Arriendo estimado"
                    value={formatCLP(quote.arriendoCLP)}
                    sub={`Rentabilidad bruta ${formatPct(quote.rentabilidadBrutaAnual, 2)}`}
                    tone="accent"
                  />
                )}
                {cashflow && cashflow.proyeccion.length > 0 && (
                  <Stat
                    label={`Ganancia estimada al año ${cashflow.proyeccion[cashflow.proyeccion.length - 1].anio}`}
                    value={
                      <span
                        className={
                          cashflow.proyeccion[cashflow.proyeccion.length - 1].gananciaTotalUF >= 0
                            ? 'pos'
                            : 'neg'
                        }
                      >
                        {formatCLPSigned(
                          cashflow.proyeccion[cashflow.proyeccion.length - 1].gananciaTotalUF *
                            cashflow.ufValue,
                        )}
                      </span>
                    }
                    sub={`Plusvalía ${formatPct(cashflow.plusvaliaAnual)} anual · invertido ${formatUF(cashflow.inversionInicialUF)}`}
                  />
                )}
                <Link
                  to={`/cotizacion/${quoteUrl({ ...params, projectId: project.id }).split('#/cotizacion/')[1]}`}
                  className="btn btn-accent btn-lg btn-block"
                >
                  GENERAR COTIZACIÓN
                </Link>
                {!isCotizable(unit) && (
                  <Note tone="danger">
                    Esta unidad ya no está disponible para cotizar según el stock actual.
                  </Note>
                )}
              </div>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
