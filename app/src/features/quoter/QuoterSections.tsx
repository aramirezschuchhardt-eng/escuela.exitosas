import { Link } from 'react-router-dom';
import type { DividendoEscenario, PricingBreakdown, QuoteResult } from '../../domain/finance';
import type { Project, Unit } from '../../domain/types';
import {
  EMPTY,
  formatCLP,
  formatCLPSigned,
  formatM2,
  formatPct,
  formatUF,
  roundToStep,
} from '../../domain/money';
import { superficieTotal, tipologiaLabel } from '../../domain/units';
import {
  Badge,
  Card,
  DL,
  Field,
  Note,
  NumberInput,
  Row,
  Segmented,
  Slider,
  Stat,
  StatusBadge,
} from '../../components/ui';

/* ── 6. Unidad seleccionada ──────────────────────────────────────────────── */
export function UnidadSeleccionada({
  project,
  unit,
  onCambiar,
}: {
  project: Project;
  unit: Unit;
  onCambiar: () => void;
}) {
  return (
    <Card
      title="Unidad seleccionada"
      desc="Datos tomados directamente de la planilla de stock."
      aside={
        <button className="btn btn-outline btn-sm no-print" onClick={onCambiar}>
          Cambiar unidad
        </button>
      }
    >
      <div className="grid grid-2">
        <DL>
          <Row label="Proyecto" value={project.nombre} />
          <Row label="Departamento" value={unit.departamento} />
          <Row label="Piso" value={unit.piso ?? EMPTY} />
          <Row label="Modelo" value={unit.modelo ?? EMPTY} />
          <Row label="Tipología" value={tipologiaLabel(unit) ?? EMPTY} />
          <Row label="Estado" value={<StatusBadge estado={unit.estado} />} />
        </DL>
        <DL>
          <Row label="Dormitorios" value={unit.dormitorios ?? EMPTY} />
          <Row label="Baños" value={unit.banos ?? EMPTY} />
          <Row label="Orientación" value={unit.orientacion ?? EMPTY} />
          <Row label="Superficie útil" value={formatM2(unit.superficieUtil)} />
          <Row label="Terraza" value={formatM2(unit.superficieTerraza)} />
          <Row label="Superficie total" value={formatM2(superficieTotal(unit))} total />
        </DL>
      </div>
      {Object.keys(unit.extra).length > 0 && (
        <details style={{ marginTop: 14 }}>
          <summary className="small muted" style={{ cursor: 'pointer' }}>
            Otros datos de la planilla ({Object.keys(unit.extra).length})
          </summary>
          <DL>
            {Object.entries(unit.extra).map(([k, v]) => (
              <Row key={k} label={k} value={String(v)} muted />
            ))}
          </DL>
        </details>
      )}
    </Card>
  );
}

/* ── 7. Precio y descuento ───────────────────────────────────────────────── */
export function PrecioYDescuento({ pricing }: { pricing: PricingBreakdown }) {
  const hayDescuento = pricing.descuentoMontoUF > 0.001;
  return (
    <Card title="Precio y descuento">
      <div className="grid grid-3">
        <Stat label="Precio lista" value={formatUF(pricing.precioListaUF)} />
        <Stat
          label="Descuento"
          value={hayDescuento ? `− ${formatUF(pricing.descuentoMontoUF)}` : formatUF(0)}
          sub={hayDescuento ? formatPct(pricing.descuentoPct) : 'sin descuento'}
        />
        <Stat
          label="Precio con descuento"
          value={formatUF(pricing.precioConDescuentoUF)}
          tone="dark"
          size="lg"
        />
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <Badge tone={pricing.fuente === 'planilla' ? 'accent' : 'neutral'}>
          {pricing.fuente === 'planilla'
            ? 'Precio final según planilla'
            : pricing.fuente === 'calculado'
              ? 'Precio final calculado'
              : 'Sin descuento'}
        </Badge>
        <span className="small muted">{pricing.detalleDescuento}</span>
      </div>
    </Card>
  );
}

/* ── 8. Bono pie ─────────────────────────────────────────────────────────── */
export function BonoPie({
  project,
  quote,
  valor,
  onChange,
}: {
  project: Project;
  quote: QuoteResult;
  valor: number;
  onChange: (v: number) => void;
}) {
  const cfg = project.config.bonoPie;
  if (!cfg.enabled) {
    return (
      <Card title="Bono pie">
        <Note tone="muted">
          Este proyecto <strong>no contempla bono pie</strong>. Se puede activar por proyecto desde
          el panel administrador.
        </Note>
      </Card>
    );
  }
  const pasos: number[] = [];
  for (let p = cfg.minPct; p <= cfg.maxPct + 1e-9; p += 0.01) pasos.push(Math.round(p * 100) / 100);

  return (
    <Card
      title="Bono pie"
      desc={`Configurable entre ${formatPct(cfg.minPct, 0)} y ${formatPct(cfg.maxPct, 0)} del precio considerado.`}
    >
      <div className="stack stack-md">
        <div className="row" style={{ gap: 6 }}>
          {pasos.map((p) => (
            <button
              key={p}
              type="button"
              className="segmented-item"
              style={{ flex: 'none', minWidth: 54, padding: '7px 10px' }}
              aria-pressed={Math.abs(p - valor) < 1e-9}
              onClick={() => onChange(p)}
            >
              {formatPct(p, 0)}
            </button>
          ))}
        </div>
        <div className="row" style={{ flexWrap: 'nowrap', gap: 14 }}>
          <div className="grow">
            <Slider
              value={Math.round(valor * 1000)}
              onChange={(v) => onChange(v / 1000)}
              min={Math.round(cfg.minPct * 1000)}
              max={Math.round(cfg.maxPct * 1000)}
              step={1}
              ariaLabel="Porcentaje de bono pie"
            />
          </div>
          <div style={{ width: 112, flex: 'none' }}>
            <NumberInput
              value={Math.round(valor * 1000) / 10}
              onChange={(v) => onChange((v ?? 0) / 100)}
              suffix="%"
              min={cfg.minPct * 100}
              max={cfg.maxPct * 100}
            />
          </div>
        </div>
        <div className="grid grid-2">
          <Stat label="Porcentaje bono pie" value={formatPct(quote.bonoPiePct)} />
          <Stat
            label="Monto bono pie"
            value={formatUF(quote.bonoPieUF)}
            sub={formatCLP(quote.bonoPieUF * quote.ufValue)}
            tone="accent"
          />
        </div>
        <Note tone="muted">
          El bono pie es un aporte de la inmobiliaria: se descuenta del pie requerido y{' '}
          <strong>no forma parte del aporte efectivo del cliente</strong>.
        </Note>
      </div>
    </Card>
  );
}

/* ── 9. Estructura de financiamiento ─────────────────────────────────────── */
export function Financiamiento({
  project,
  quote,
  ltv,
  onLtv,
}: {
  project: Project;
  quote: QuoteResult;
  ltv: number;
  onLtv: (v: number) => void;
}) {
  const opciones = project.config.financiamiento;
  return (
    <Card
      title="¿Cómo quieres financiar esta propiedad?"
      desc="Las opciones disponibles se configuran por proyecto."
    >
      <div className="stack stack-md">
        <Segmented
          label="Opción de financiamiento"
          value={ltv}
          onChange={onLtv}
          options={opciones.map((f) => ({
            value: f,
            label: `FINANCIAMIENTO ${(f * 100).toFixed(0)}%`,
            sub: `Pie ${((1 - f) * 100).toFixed(0)}%`,
          }))}
        />

        <DL>
          <Row label="Precio de la propiedad" value={formatUF(quote.precioConsideradoUF)} />
          <Row
            label="Crédito hipotecario"
            value={formatUF(quote.creditoHipotecarioUF)}
            hint={formatPct(quote.ltv, 0)}
          />
          <Row
            label="Pie requerido"
            value={formatUF(quote.pieTotalUF)}
            hint={formatPct(quote.pieTotalPct, 0)}
          />
          {quote.bonoPieUF > 0 && (
            <Row label="− Bono pie" value={`− ${formatUF(quote.bonoPieUF)}`} muted />
          )}
          {quote.creditoDirectoUF > 0 && (
            <Row
              label="− Crédito directo inmobiliario"
              value={`− ${formatUF(quote.creditoDirectoUF)}`}
              muted
            />
          )}
          <Row
            label="Aporte efectivo estimado del cliente"
            value={formatUF(quote.aporteEfectivoUF)}
            hint={formatCLP(quote.aporteEfectivoCLP)}
            total
          />
        </DL>

        {Math.abs(ltv - 0.8) < 1e-9 && project.config.creditoDirecto.enabled && (
          <Note tone="info">
            Con financiamiento 80% el pie de {formatPct(quote.pieTotalPct, 0)} puede estructurarse
            con hasta {formatPct(project.config.creditoDirecto.maxPct, 0)} de crédito directo
            inmobiliario y el resto como pie inicial.
          </Note>
        )}
      </div>
    </Card>
  );
}

/* ── 10. Crédito directo inmobiliario ────────────────────────────────────── */
export function CreditoDirecto({
  project,
  quote,
  pct,
  cuotas,
  onPct,
  onCuotas,
}: {
  project: Project;
  quote: QuoteResult;
  pct: number;
  cuotas: number;
  onPct: (v: number) => void;
  onCuotas: (v: number) => void;
}) {
  const cfg = project.config.creditoDirecto;
  if (!cfg.enabled) {
    return (
      <Card title="Crédito directo inmobiliario">
        <Note tone="muted">
          Este proyecto <strong>no ofrece crédito directo inmobiliario</strong>. Se puede activar por
          proyecto desde el panel administrador.
        </Note>
      </Card>
    );
  }

  const topeEfectivo = Math.min(cfg.maxPct, quote.pieTotalPct);
  const pasos: number[] = [];
  for (let p = 0; p <= topeEfectivo + 1e-9; p += 0.01) pasos.push(Math.round(p * 100) / 100);

  return (
    <Card
      title="Crédito directo inmobiliario"
      desc={
        cfg.tasaAnual === 0
          ? `Hasta ${formatPct(cfg.maxPct, 0)} del valor de la propiedad, sin interés.`
          : `Hasta ${formatPct(cfg.maxPct, 0)} del valor de la propiedad, tasa ${formatPct(cfg.tasaAnual)} anual.`
      }
      aside={cfg.tasaAnual === 0 ? <Badge tone="ok">0% interés</Badge> : null}
    >
      <div className="stack stack-md">
        <Field label="Porcentaje del precio a financiar directamente">
          <div className="row" style={{ gap: 6 }}>
            {pasos.map((p) => (
              <button
                key={p}
                type="button"
                className="segmented-item"
                style={{ flex: 'none', minWidth: 54, padding: '7px 10px' }}
                aria-pressed={Math.abs(p - pct) < 1e-9}
                onClick={() => onPct(p)}
              >
                {formatPct(p, 0)}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Número de cuotas">
          <Segmented
            label="Número de cuotas"
            value={cuotas}
            onChange={onCuotas}
            options={cfg.plazos.map((p) => ({ value: p, label: `${p}` }))}
          />
        </Field>

        <div className="grid grid-3">
          <Stat
            label="Monto crédito directo"
            value={formatUF(quote.creditoDirectoUF)}
            sub={formatCLP(quote.creditoDirectoUF * quote.ufValue)}
          />
          <Stat label="Cuotas" value={`${quote.creditoDirectoCuotas}`} sub={cfg.tasaAnual === 0 ? 'sin interés' : `tasa ${formatPct(cfg.tasaAnual)}`} />
          <Stat
            label="Cuota mensual"
            value={formatCLP(quote.cuotaCreditoDirectoCLP)}
            sub={formatUF(quote.cuotaCreditoDirectoUF)}
            tone="accent"
          />
        </div>

        <Note tone="muted">
          El crédito directo inmobiliario es <strong>independiente del dividendo hipotecario</strong>{' '}
          y se paga en paralelo durante {quote.creditoDirectoCuotas} meses.
        </Note>
      </div>
    </Card>
  );
}

/* ── 11. Simulador de dividendo ──────────────────────────────────────────── */
export function SimuladorDividendo({
  project,
  quote,
  plazo,
  onPlazo,
  ltv,
  onLtv,
}: {
  project: Project;
  quote: QuoteResult;
  plazo: number;
  onPlazo: (v: number) => void;
  ltv: number;
  onLtv: (v: number) => void;
}) {
  const cfg = project.config;
  const mejor = quote.dividendos.reduce<DividendoEscenario | null>(
    (best, d) => (best == null || d.dividendoCLP < best.dividendoCLP ? d : best),
    null,
  );

  return (
    <Card
      title="Simulador de dividendo"
      desc="Cuota fija (sistema francés) sobre el monto del crédito hipotecario. Las tres tasas se muestran simultáneamente."
    >
      <div className="stack stack-md">
        <div className="grid grid-2">
          <Field label="Porcentaje de financiamiento">
            <Segmented
              label="Porcentaje de financiamiento"
              value={ltv}
              onChange={onLtv}
              options={cfg.financiamiento.map((f) => ({
                value: f,
                label: `${(f * 100).toFixed(0)}%`,
              }))}
            />
          </Field>
          <Field label="Plazo del crédito">
            <Segmented
              label="Plazo del crédito"
              value={plazo}
              onChange={onPlazo}
              options={cfg.plazosAnios.map((p) => ({ value: p, label: `${p} años` }))}
            />
          </Field>
        </div>

        <div className="grid grid-3">
          {quote.dividendos.map((d) => (
            <div key={d.tasaAnual} className={`rate-card${d === mejor ? ' is-best' : ''}`}>
              <div className="row-between">
                <span className="rate-tag">TASA {formatPct(d.tasaAnual)}</span>
                {d === mejor && <Badge tone="ok">menor</Badge>}
              </div>
              <div className="stat-value" style={{ fontSize: 22, marginTop: 6 }}>
                {formatCLP(d.dividendoCLP)}
              </div>
              <div className="stat-sub">{formatUF(d.dividendoUF)} al mes</div>
              <div className="divider" style={{ margin: '9px 0' }} />
              <div className="xs dim mono">
                {plazo * 12} cuotas · intereses {formatUF(d.interesesTotalesUF)}
              </div>
            </div>
          ))}
        </div>

        <Note tone="warn">
          <span>
            <strong>Simulación referencial.</strong> El dividendo no incluye seguros de desgravamen e
            incendio, gastos operacionales ni otros costos asociados al crédito. Las tasas son
            escenarios configurables, no ofertas de crédito. Conversión de tasa anual a mensual:{' '}
            {cfg.convencionTasa === 'efectivaAnual'
              ? 'tasa efectiva anual ((1+i)^(1/12)−1)'
              : 'tasa nominal anual (i/12)'}
            .
          </span>
        </Note>
      </div>
    </Card>
  );
}

/* ── 12. Costo mensual total ─────────────────────────────────────────────── */
export function CostoMensualTotal({
  quote,
  tasaSeleccionada,
  onTasa,
}: {
  quote: QuoteResult;
  tasaSeleccionada: number;
  onTasa: (t: number) => void;
}) {
  const d =
    quote.dividendos.find((x) => Math.abs(x.tasaAnual - tasaSeleccionada) < 1e-9) ??
    quote.dividendos[0];
  if (!d) return null;

  const hayCd = quote.cuotaCreditoDirectoCLP > 0;

  return (
    <Card
      title="Desembolso mensual total"
      desc="Lo que el cliente paga cada mes, en sus dos etapas."
      aside={
        <Segmented
          label="Tasa"
          value={d.tasaAnual}
          onChange={onTasa}
          options={quote.dividendos.map((x) => ({
            value: x.tasaAnual,
            label: formatPct(x.tasaAnual),
          }))}
        />
      }
    >
      <div className="grid grid-2">
        <div className="stage stack stack-sm">
          <p className="eyebrow">
            {hayCd ? `Primeros ${quote.creditoDirectoCuotas} meses` : 'Desembolso mensual'}
          </p>
          <DL>
            <Row label="Dividendo hipotecario" value={formatCLP(d.dividendoCLP)} />
            {hayCd && (
              <Row
                label="+ Cuota crédito directo"
                value={formatCLP(quote.cuotaCreditoDirectoCLP)}
              />
            )}
            <Row label="Desembolso mensual" value={formatCLP(d.desembolsoEtapa1CLP)} total />
          </DL>
        </div>

        {hayCd && (
          <div className="stage stage-2 stack stack-sm">
            <p className="eyebrow">Desde el mes {quote.creditoDirectoCuotas + 1}</p>
            <DL>
              <Row label="Dividendo hipotecario" value={formatCLP(d.dividendoCLP)} />
              <Row label="Cuota crédito directo" value="Finalizada" muted />
              <Row label="Desembolso mensual" value={formatCLP(d.desembolsoEtapa2CLP)} total />
            </DL>
          </div>
        )}
      </div>

      {hayCd && (
        <Note tone="info">
          <span>
            Al terminar el crédito directo el desembolso mensual{' '}
            <strong>baja {formatCLP(quote.cuotaCreditoDirectoCLP)}</strong>, quedando sólo el
            dividendo hipotecario.
          </span>
        </Note>
      )}
    </Card>
  );
}

/* ── 13-14. Arriendo estimado, rentabilidad y flujo ──────────────────────── */
export function ArriendoYFlujo({
  project,
  quote,
  arriendo,
  onArriendo,
  tasaSeleccionada,
}: {
  project: Project;
  quote: QuoteResult;
  arriendo: number | null;
  onArriendo: (v: number | null) => void;
  tasaSeleccionada: number;
}) {
  const cfg = project.config.arriendo;
  const d =
    quote.dividendos.find((x) => Math.abs(x.tasaAnual - tasaSeleccionada) < 1e-9) ??
    quote.dividendos[0];
  const hayCd = quote.cuotaCreditoDirectoCLP > 0;
  const valorSlider = arriendo ?? cfg.minCLP;

  return (
    <>
      <Card
        title="Arriendo mensual estimado"
        desc="Valor editable por el broker. No proviene de la planilla."
      >
        <div className="stack stack-md">
          <div className="row" style={{ flexWrap: 'nowrap', gap: 14 }}>
            <div className="grow">
              <Slider
                value={Math.min(Math.max(valorSlider, cfg.minCLP), cfg.maxCLP)}
                onChange={(v) => onArriendo(roundToStep(v, cfg.stepCLP))}
                min={cfg.minCLP}
                max={cfg.maxCLP}
                step={cfg.stepCLP}
                ariaLabel="Arriendo mensual estimado"
              />
              <div className="row-between xs dim" style={{ marginTop: 2 }}>
                <span>{formatCLP(cfg.minCLP)}</span>
                <span>incrementos de {formatCLP(cfg.stepCLP)}</span>
                <span>{formatCLP(cfg.maxCLP)}</span>
              </div>
            </div>
            <div style={{ width: 150, flex: 'none' }}>
              <NumberInput
                value={arriendo}
                onChange={onArriendo}
                placeholder="Monto manual"
                suffix="$"
              />
            </div>
          </div>

          {arriendo == null ? (
            <Note tone="warn">
              Ingrese el arriendo mensual estimado para calcular rentabilidad y flujo. El sistema no
              asume un valor por su cuenta.
            </Note>
          ) : (
            <div className="grid grid-3">
              <Stat label="Arriendo mensual" value={formatCLP(quote.arriendoCLP)} tone="accent" />
              <Stat label="Arriendo anual" value={formatCLP(quote.arriendoAnualCLP)} />
              <Stat
                label="Rentabilidad bruta anual"
                value={formatPct(quote.rentabilidadBrutaAnual, 2)}
                sub="arriendo anual / precio con descuento"
              />
            </div>
          )}

          <Note tone="warn">
            <span>
              <strong>Arriendo mensual estimado, no garantizado.</strong> Es una estimación
              referencial del broker y no constituye una promesa de renta ni de rentabilidad.
            </span>
          </Note>
        </div>
      </Card>

      {arriendo != null && d && (
        <Card title="Flujo mensual estimado" desc={`Con tasa ${formatPct(d.tasaAnual)}.`}>
          <div className="grid grid-2">
            <div className="stage stack stack-sm">
              <p className="eyebrow">
                {hayCd ? `Primeros ${quote.creditoDirectoCuotas} meses` : 'Flujo mensual'}
              </p>
              <DL>
                <Row label="Arriendo estimado" value={formatCLP(quote.arriendoCLP)} />
                <Row label="Dividendo hipotecario" value={`− ${formatCLP(d.dividendoCLP)}`} muted />
                {hayCd && (
                  <Row
                    label="Cuota crédito directo"
                    value={`− ${formatCLP(quote.cuotaCreditoDirectoCLP)}`}
                    muted
                  />
                )}
                <Row
                  label="Flujo mensual"
                  value={
                    <span className={(d.flujoEtapa1CLP ?? 0) >= 0 ? 'pos' : 'neg'}>
                      {formatCLPSigned(d.flujoEtapa1CLP)}
                    </span>
                  }
                  total
                />
              </DL>
            </div>

            {hayCd && (
              <div className="stage stage-2 stack stack-sm">
                <p className="eyebrow">Desde el mes {quote.creditoDirectoCuotas + 1}</p>
                <DL>
                  <Row label="Arriendo estimado" value={formatCLP(quote.arriendoCLP)} />
                  <Row label="Dividendo hipotecario" value={`− ${formatCLP(d.dividendoCLP)}`} muted />
                  <Row label="Cuota crédito directo" value="Finalizada" muted />
                  <Row
                    label="Flujo mensual"
                    value={
                      <span className={(d.flujoEtapa2CLP ?? 0) >= 0 ? 'pos' : 'neg'}>
                        {formatCLPSigned(d.flujoEtapa2CLP)}
                      </span>
                    }
                    total
                  />
                </DL>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
}

/* ── 15. Devolución de IVA ───────────────────────────────────────────────── */
export function DevolucionIva({
  project,
  quote,
  pct,
  onPct,
}: {
  project: Project;
  quote: QuoteResult;
  pct: number;
  onPct: (v: number) => void;
}) {
  const cfg = project.config.iva;
  if (!cfg.enabled) {
    return (
      <Card title="Devolución de IVA">
        <Note tone="muted">
          Este proyecto <strong>no contempla devolución de IVA</strong> en su configuración.
        </Note>
      </Card>
    );
  }

  const pasos: number[] = [];
  for (let p = cfg.minPct; p <= cfg.maxPct + 1e-9; p += 0.01) pasos.push(Math.round(p * 100) / 100);

  return (
    <Card
      title="Devolución de IVA"
      desc={`Beneficio estimado, entre ${formatPct(cfg.minPct, 0)} y ${formatPct(cfg.maxPct, 0)}.`}
    >
      <div className="stack stack-md">
        <div className="row" style={{ gap: 6 }}>
          {pasos.map((p) => (
            <button
              key={p}
              type="button"
              className="segmented-item"
              style={{ flex: 'none', minWidth: 54, padding: '7px 10px' }}
              aria-pressed={Math.abs(p - pct) < 1e-9}
              onClick={() => onPct(p)}
            >
              {formatPct(p, 0)}
            </button>
          ))}
        </div>

        <div className="grid grid-3">
          <Stat label="Porcentaje seleccionado" value={formatPct(quote.ivaPct)} />
          <Stat
            label="Devolución estimada"
            value={formatUF(quote.ivaMontoUF)}
            sub={formatCLP(quote.ivaMontoCLP)}
            tone="accent"
          />
          <Stat
            label="Valor efectivo estimado"
            value={formatUF(quote.valorEfectivoPostIvaUF)}
            sub="precio con descuento − devolución"
          />
        </div>

        <Note tone={cfg.aplicarAlFinanciamiento ? 'info' : 'muted'}>
          {cfg.aplicarAlFinanciamiento ? (
            <span>
              Este proyecto está configurado para <strong>descontar la devolución de IVA del
              precio financiado</strong>. El crédito hipotecario y el pie se calculan sobre el precio
              ya rebajado.
            </span>
          ) : (
            <span>
              La devolución de IVA se presenta como <strong>beneficio estimado aparte</strong>: no se
              descuenta del precio de compra ni del monto financiado. Está sujeta a que el cliente
              cumpla los requisitos correspondientes.
            </span>
          )}
        </Note>
      </div>
    </Card>
  );
}

/* ── 16. Resumen de inversión ────────────────────────────────────────────── */
export function ResumenInversion({
  project,
  unit,
  quote,
  tasaSeleccionada,
}: {
  project: Project;
  unit: Unit;
  quote: QuoteResult;
  tasaSeleccionada: number;
}) {
  const d =
    quote.dividendos.find((x) => Math.abs(x.tasaAnual - tasaSeleccionada) < 1e-9) ??
    quote.dividendos[0];
  const hayCd = quote.creditoDirectoUF > 0;

  return (
    <Card title="Resumen de tu inversión" className="stack">
      <div className="grid grid-2">
        <DL>
          <Row label="Proyecto" value={project.nombre} />
          <Row label="Unidad" value={`Depto. ${unit.departamento}${unit.piso != null ? ` · Piso ${unit.piso}` : ''}`} />
          <Row label="Tipología" value={tipologiaLabel(unit) ?? EMPTY} />
          <Row label="Superficie total" value={formatM2(superficieTotal(unit))} />
          <Row label="Precio lista" value={formatUF(quote.pricing.precioListaUF)} />
          <Row
            label="Descuento"
            value={
              quote.pricing.descuentoMontoUF > 0
                ? `− ${formatUF(quote.pricing.descuentoMontoUF)} (${formatPct(quote.pricing.descuentoPct)})`
                : EMPTY
            }
            muted
          />
          <Row label="Precio con descuento" value={formatUF(quote.pricing.precioConDescuentoUF)} total />
        </DL>

        <DL>
          <Row label="Financiamiento" value={formatPct(quote.ltv, 0)} />
          <Row label="Crédito hipotecario" value={formatUF(quote.creditoHipotecarioUF)} />
          <Row label="Pie requerido" value={formatUF(quote.pieTotalUF)} />
          <Row label="Bono pie" value={quote.bonoPieUF > 0 ? formatUF(quote.bonoPieUF) : EMPTY} muted />
          <Row
            label="Crédito directo inmobiliario"
            value={hayCd ? formatUF(quote.creditoDirectoUF) : EMPTY}
            muted
          />
          <Row
            label="Cuota crédito directo"
            value={hayCd ? `${formatCLP(quote.cuotaCreditoDirectoCLP)} × ${quote.creditoDirectoCuotas}` : EMPTY}
            muted
          />
          <Row label="Aporte efectivo del cliente" value={formatUF(quote.aporteEfectivoUF)} total />
        </DL>
      </div>

      <div className="divider" style={{ margin: '16px 0' }} />

      <p className="eyebrow" style={{ marginBottom: 8 }}>
        Dividendo a {quote.plazoAnios} años
      </p>
      <div className="grid grid-3">
        {quote.dividendos.map((x) => (
          <Stat
            key={x.tasaAnual}
            label={`Tasa ${formatPct(x.tasaAnual)}`}
            value={formatCLP(x.dividendoCLP)}
            sub={formatUF(x.dividendoUF)}
            tone={x === d ? 'accent' : 'default'}
          />
        ))}
      </div>

      {quote.arriendoCLP != null && d && (
        <>
          <div className="divider" style={{ margin: '16px 0' }} />
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Arriendo y flujo (tasa {formatPct(d.tasaAnual)})
          </p>
          <div className="grid grid-4">
            <Stat label="Arriendo mensual" value={formatCLP(quote.arriendoCLP)} />
            <Stat label="Arriendo anual" value={formatCLP(quote.arriendoAnualCLP)} />
            <Stat
              label={hayCd ? `Flujo primeros ${quote.creditoDirectoCuotas} meses` : 'Flujo mensual'}
              value={
                <span className={(d.flujoEtapa1CLP ?? 0) >= 0 ? 'pos' : 'neg'}>
                  {formatCLPSigned(d.flujoEtapa1CLP)}
                </span>
              }
            />
            <Stat
              label={hayCd ? `Flujo desde mes ${quote.creditoDirectoCuotas + 1}` : 'Rentabilidad bruta'}
              value={
                hayCd ? (
                  <span className={(d.flujoEtapa2CLP ?? 0) >= 0 ? 'pos' : 'neg'}>
                    {formatCLPSigned(d.flujoEtapa2CLP)}
                  </span>
                ) : (
                  formatPct(quote.rentabilidadBrutaAnual, 2)
                )
              }
            />
          </div>
        </>
      )}

      {quote.ivaAplica && quote.ivaMontoUF > 0 && (
        <>
          <div className="divider" style={{ margin: '16px 0' }} />
          <div className="grid grid-2">
            <Stat
              label={`Devolución IVA estimada (${formatPct(quote.ivaPct, 0)})`}
              value={formatUF(quote.ivaMontoUF)}
              sub={formatCLP(quote.ivaMontoCLP)}
            />
            <Stat label="Valor efectivo estimado" value={formatUF(quote.valorEfectivoPostIvaUF)} />
          </div>
        </>
      )}
    </Card>
  );
}

/* ── 17. Comparación de escenarios ───────────────────────────────────────── */
export function ComparadorEscenarios({
  escenarios,
}: {
  escenarios: {
    nombre: string;
    ltv: number;
    tasaAnual: number;
    usarCreditoDirecto: boolean;
    disponible: boolean;
    motivoNoDisponible?: string;
    quote: QuoteResult;
    dividendo: DividendoEscenario | null;
  }[];
}) {
  return (
    <Card
      title="Comparación de escenarios"
      desc="Cada escenario se recalcula completo: pie, crédito y dividendo corresponden a su propio porcentaje de financiamiento."
    >
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Concepto</th>
              {escenarios.map((e) => (
                <th key={e.nombre} className="num">
                  {e.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Financiamiento</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num">
                  {formatPct(e.quote.ltv, 0)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Tasa</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num">
                  {formatPct(e.tasaAnual)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Crédito hipotecario</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num">
                  {formatUF(e.quote.creditoHipotecarioUF)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Pie requerido</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num">
                  {formatUF(e.quote.pieTotalUF)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Crédito directo</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num">
                  {e.quote.creditoDirectoUF > 0 ? formatUF(e.quote.creditoDirectoUF) : EMPTY}
                </td>
              ))}
            </tr>
            <tr>
              <td>Aporte efectivo</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num" style={{ fontWeight: 600 }}>
                  {formatUF(e.quote.aporteEfectivoUF)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Dividendo mensual</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num" style={{ fontWeight: 600 }}>
                  {formatCLP(e.dividendo?.dividendoCLP)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Cuota crédito directo</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num">
                  {e.quote.cuotaCreditoDirectoCLP > 0
                    ? formatCLP(e.quote.cuotaCreditoDirectoCLP)
                    : EMPTY}
                </td>
              ))}
            </tr>
            <tr>
              <td>Desembolso etapa 1</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num" style={{ fontWeight: 600 }}>
                  {formatCLP(e.dividendo?.desembolsoEtapa1CLP)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Desembolso etapa 2</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num">
                  {formatCLP(e.dividendo?.desembolsoEtapa2CLP)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Flujo etapa 1</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num">
                  <span className={(e.dividendo?.flujoEtapa1CLP ?? 0) >= 0 ? 'pos' : 'neg'}>
                    {formatCLPSigned(e.dividendo?.flujoEtapa1CLP ?? null)}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td>Flujo etapa 2</td>
              {escenarios.map((e) => (
                <td key={e.nombre} className="num">
                  <span className={(e.dividendo?.flujoEtapa2CLP ?? 0) >= 0 ? 'pos' : 'neg'}>
                    {formatCLPSigned(e.dividendo?.flujoEtapa2CLP ?? null)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {escenarios.some((e) => !e.disponible) && (
        <Note tone="warn">
          {escenarios
            .filter((e) => !e.disponible)
            .map((e) => `${e.nombre}: ${e.motivoNoDisponible}`)
            .join(' ')}
        </Note>
      )}
    </Card>
  );
}

/* ── Aviso de UF sin configurar ──────────────────────────────────────────── */
export function AvisoUF({ ufValue }: { ufValue: number }) {
  if (ufValue > 0) return null;
  return (
    <Note tone="danger">
      <span>
        <strong>Valor de la UF sin configurar.</strong> Los montos en pesos (dividendo, cuotas,
        arriendo y flujo) no pueden calcularse hasta que se registre el valor de la UF en{' '}
        <Link to="/admin" style={{ textDecoration: 'underline' }}>
          Administrar → Configuración
        </Link>
        . Los montos en UF sí son correctos.
      </span>
    </Note>
  );
}
