import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../../data/store';
import { computeQuote, pricingFromUnit } from '../../domain/finance';
import { superficieTotal, tipologiaLabel } from '../../domain/units';
import {
  EMPTY,
  formatCLP,
  formatCLPSigned,
  formatDate,
  formatM2,
  formatPct,
  formatUF,
} from '../../domain/money';
import { decodeQuote, mailtoUrl, quoteUrl, whatsappUrl } from '../../lib/share';
import { Badge, DL, Empty, Note, Row, useToast } from '../../components/ui';

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="doc-section">
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}

export default function QuoteDocPage() {
  const { token } = useParams();
  const { getProject, units, settings } = useStore();
  const toast = useToast();
  const [tasaIdx, setTasaIdx] = useState(0);

  const params = useMemo(() => (token ? decodeQuote(token) : null), [token]);
  const project = params ? getProject(params.projectId) : undefined;
  const unit = params ? units.find((u) => u.id === params.unitId) : undefined;

  const quote = useMemo(() => {
    if (!project || !unit || !params) return null;
    return computeQuote({
      pricing: pricingFromUnit(unit),
      config: project.config,
      ufValue: settings?.ufValue ?? 0,
      bonoPiePct: params.bonoPiePct,
      ltv: params.ltv,
      creditoDirectoPct: params.creditoDirectoPct,
      creditoDirectoCuotas: params.creditoDirectoCuotas,
      plazoAnios: params.plazoAnios,
      arriendoCLP: params.arriendoCLP,
      ivaPct: params.ivaPct,
    });
  }, [project, unit, params, settings?.ufValue]);

  if (!params || !project || !unit || !quote) {
    return (
      <div className="container section">
        <Empty
          titulo="Cotización no disponible"
          accion={
            <Link className="btn btn-primary" to="/">
              Ir al catálogo
            </Link>
          }
        >
          El link de la cotización no es válido, o la unidad ya no existe en el stock de este
          navegador. Las cotizaciones se reconstruyen con los datos de stock cargados localmente.
        </Empty>
      </div>
    );
  }

  const brand = settings?.brand;
  const dividendo = quote.dividendos[Math.min(tasaIdx, quote.dividendos.length - 1)];
  const hayCd = quote.creditoDirectoUF > 0;
  const url = quoteUrl(params);
  const planta =
    project.tipologias.find((t) => t.nombre === tipologiaLabel(unit))?.plantaUrl ??
    project.galeria.find((g) => g.grupo === 'planta')?.url ??
    null;

  const resumenTexto = [
    `${project.nombre} — Depto. ${unit.departamento}`,
    `Precio con descuento: ${formatUF(quote.pricing.precioConDescuentoUF)}`,
    `Financiamiento ${formatPct(quote.ltv, 0)} · Aporte efectivo ${formatUF(quote.aporteEfectivoUF)}`,
    dividendo ? `Dividendo tasa ${formatPct(dividendo.tasaAnual)}: ${formatCLP(dividendo.dividendoCLP)}` : '',
    hayCd ? `Crédito directo: ${formatCLP(quote.cuotaCreditoDirectoCLP)} × ${quote.creditoDirectoCuotas} cuotas` : '',
    quote.arriendoCLP != null ? `Arriendo mensual estimado: ${formatCLP(quote.arriendoCLP)}` : '',
    '',
    'Ver cotización completa:',
    url,
    '',
    settings?.disclaimer ?? '',
  ]
    .filter(Boolean)
    .join('\n');

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copiado al portapapeles', 'ok');
    } catch {
      toast('No fue posible copiar. Copie el link manualmente.', 'error');
    }
  };

  return (
    <div className="container section stack stack-md">
      <div className="no-print row-between">
        <Link
          to={`/cotizar/${project.id}/${unit.id}`}
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: -11 }}
        >
          ← Volver al cotizador
        </Link>
        <div className="row">
          <select
            className="select"
            style={{ width: 'auto' }}
            value={tasaIdx}
            onChange={(e) => setTasaIdx(Number(e.target.value))}
            aria-label="Tasa destacada en la cotización"
          >
            {quote.dividendos.map((d, i) => (
              <option key={d.tasaAnual} value={i}>
                Destacar tasa {formatPct(d.tasaAnual)}
              </option>
            ))}
          </select>
          <button className="btn btn-outline btn-sm" onClick={copiarLink}>
            Copiar link
          </button>
          <a
            className="btn btn-outline btn-sm"
            href={whatsappUrl(resumenTexto)}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
          <a
            className="btn btn-outline btn-sm"
            href={mailtoUrl(`Cotización ${project.nombre} — Depto. ${unit.departamento}`, resumenTexto)}
          >
            Correo
          </a>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
            Descargar PDF
          </button>
        </div>
      </div>

      <Note tone="muted">
        <span className="no-print">
          <strong>Descargar PDF</strong> abre el diálogo de impresión del navegador: elija
          «Guardar como PDF». El documento está preparado para tamaño carta/A4.
        </span>
      </Note>

      <article className="doc">
        <div className="doc-inner">
          <header className="doc-header">
            <div className="row" style={{ gap: 12 }}>
              {brand?.logoUrl && (
                <img src={brand.logoUrl} alt="" style={{ height: 42, width: 'auto' }} />
              )}
              <div>
                <p className="eyebrow">{brand?.nombreEmpresa || 'Cotización'}</p>
                <h1>{project.nombre}</h1>
                <p className="small muted">
                  {[project.direccion, project.comuna].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div className="right small">
              <p className="eyebrow">Cotización</p>
              <p className="mono">{formatDate(new Date().toISOString())}</p>
              <p className="mono">Depto. {unit.departamento}</p>
              {settings?.ufValue ? (
                <p className="xs dim mono">UF {settings.ufValue.toLocaleString('es-CL')}</p>
              ) : null}
            </div>
          </header>

          {project.imagenPrincipal && (
            <img className="doc-cover" src={project.imagenPrincipal} alt={project.nombre} />
          )}

          <Seccion titulo="Unidad">
            <div className="grid grid-2">
              <DL>
                <Row label="Departamento" value={unit.departamento} />
                <Row label="Piso" value={unit.piso ?? EMPTY} />
                <Row label="Modelo" value={unit.modelo ?? EMPTY} />
                <Row label="Tipología" value={tipologiaLabel(unit) ?? EMPTY} />
              </DL>
              <DL>
                <Row label="Orientación" value={unit.orientacion ?? EMPTY} />
                <Row label="Superficie útil" value={formatM2(unit.superficieUtil)} />
                <Row label="Terraza" value={formatM2(unit.superficieTerraza)} />
                <Row label="Superficie total" value={formatM2(superficieTotal(unit))} />
              </DL>
            </div>
            {planta && (
              <img
                src={planta}
                alt="Planta"
                style={{ marginTop: 12, maxHeight: 300, objectFit: 'contain', width: '100%' }}
              />
            )}
          </Seccion>

          <Seccion titulo="Precio">
            <DL>
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
              <Row
                label="Precio con descuento"
                value={formatUF(quote.pricing.precioConDescuentoUF)}
                hint={settings?.ufValue ? formatCLP(quote.precioConsideradoCLP) : undefined}
                total
              />
            </DL>
          </Seccion>

          <Seccion titulo="Estructura de financiamiento">
            <DL>
              <Row label="Financiamiento" value={formatPct(quote.ltv, 0)} />
              <Row label="Crédito hipotecario" value={formatUF(quote.creditoHipotecarioUF)} />
              <Row
                label="Pie requerido"
                value={formatUF(quote.pieTotalUF)}
                hint={formatPct(quote.pieTotalPct, 0)}
              />
              {quote.bonoPieUF > 0 && (
                <Row
                  label="Bono pie"
                  value={`− ${formatUF(quote.bonoPieUF)}`}
                  hint={formatPct(quote.bonoPiePct)}
                  muted
                />
              )}
              {hayCd && (
                <Row
                  label="Crédito directo inmobiliario"
                  value={`− ${formatUF(quote.creditoDirectoUF)}`}
                  hint={`${formatPct(quote.creditoDirectoPct)} · ${quote.creditoDirectoCuotas} cuotas`}
                  muted
                />
              )}
              <Row label="Aporte efectivo estimado" value={formatUF(quote.aporteEfectivoUF)} total />
            </DL>
          </Seccion>

          {hayCd && (
            <Seccion titulo="Crédito directo inmobiliario">
              <DL>
                <Row label="Monto" value={formatUF(quote.creditoDirectoUF)} />
                <Row label="Número de cuotas" value={quote.creditoDirectoCuotas} />
                <Row
                  label="Tasa"
                  value={
                    project.config.creditoDirecto.tasaAnual === 0
                      ? 'Sin interés'
                      : formatPct(project.config.creditoDirecto.tasaAnual)
                  }
                />
                <Row label="Cuota mensual" value={formatCLP(quote.cuotaCreditoDirectoCLP)} total />
              </DL>
            </Seccion>
          )}

          <Seccion titulo={`Dividendo hipotecario a ${quote.plazoAnios} años`}>
            <div className="table-wrap">
              <table className="data" style={{ minWidth: 380 }}>
                <thead>
                  <tr>
                    <th>Tasa anual</th>
                    <th className="num">Dividendo mensual</th>
                    <th className="num">En UF</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.dividendos.map((d) => (
                    <tr key={d.tasaAnual}>
                      <td>
                        {formatPct(d.tasaAnual)}{' '}
                        {d === dividendo && <Badge tone="accent">destacada</Badge>}
                      </td>
                      <td className="num" style={{ fontWeight: 600 }}>
                        {formatCLP(d.dividendoCLP)}
                      </td>
                      <td className="num">{formatUF(d.dividendoUF)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>

          {dividendo && (
            <Seccion titulo={`Desembolso mensual (tasa ${formatPct(dividendo.tasaAnual)})`}>
              <div className="grid grid-2">
                <DL>
                  <p className="eyebrow" style={{ marginBottom: 4 }}>
                    {hayCd ? `Primeros ${quote.creditoDirectoCuotas} meses` : 'Mensual'}
                  </p>
                  <Row label="Dividendo hipotecario" value={formatCLP(dividendo.dividendoCLP)} />
                  {hayCd && (
                    <Row
                      label="Cuota crédito directo"
                      value={formatCLP(quote.cuotaCreditoDirectoCLP)}
                    />
                  )}
                  <Row label="Total mensual" value={formatCLP(dividendo.desembolsoEtapa1CLP)} total />
                </DL>
                {hayCd && (
                  <DL>
                    <p className="eyebrow" style={{ marginBottom: 4 }}>
                      Desde el mes {quote.creditoDirectoCuotas + 1}
                    </p>
                    <Row label="Dividendo hipotecario" value={formatCLP(dividendo.dividendoCLP)} />
                    <Row label="Cuota crédito directo" value="Finalizada" muted />
                    <Row label="Total mensual" value={formatCLP(dividendo.desembolsoEtapa2CLP)} total />
                  </DL>
                )}
              </div>
            </Seccion>
          )}

          {quote.arriendoCLP != null && dividendo && (
            <Seccion titulo="Arriendo mensual estimado y flujo">
              <DL>
                <Row label="Arriendo mensual estimado" value={formatCLP(quote.arriendoCLP)} />
                <Row label="Arriendo anual estimado" value={formatCLP(quote.arriendoAnualCLP)} />
                <Row
                  label="Rentabilidad bruta anual estimada"
                  value={formatPct(quote.rentabilidadBrutaAnual, 2)}
                />
                <Row
                  label={hayCd ? `Flujo mensual primeros ${quote.creditoDirectoCuotas} meses` : 'Flujo mensual'}
                  value={
                    <span className={(dividendo.flujoEtapa1CLP ?? 0) >= 0 ? 'pos' : 'neg'}>
                      {formatCLPSigned(dividendo.flujoEtapa1CLP)}
                    </span>
                  }
                />
                {hayCd && (
                  <Row
                    label={`Flujo mensual desde el mes ${quote.creditoDirectoCuotas + 1}`}
                    value={
                      <span className={(dividendo.flujoEtapa2CLP ?? 0) >= 0 ? 'pos' : 'neg'}>
                        {formatCLPSigned(dividendo.flujoEtapa2CLP)}
                      </span>
                    }
                  />
                )}
              </DL>
              <p className="xs dim" style={{ marginTop: 8 }}>
                Arriendo mensual estimado, no garantizado. No constituye promesa de renta ni de
                rentabilidad.
              </p>
            </Seccion>
          )}

          {quote.ivaAplica && quote.ivaMontoUF > 0 && (
            <Seccion titulo="Devolución de IVA (beneficio estimado)">
              <DL>
                <Row label="Porcentaje considerado" value={formatPct(quote.ivaPct, 0)} />
                <Row label="Devolución estimada" value={formatUF(quote.ivaMontoUF)} />
                <Row
                  label="Valor efectivo estimado tras devolución"
                  value={formatUF(quote.valorEfectivoPostIvaUF)}
                />
              </DL>
              <p className="xs dim" style={{ marginTop: 8 }}>
                {project.config.iva.aplicarAlFinanciamiento
                  ? 'Este proyecto considera la devolución de IVA dentro del precio financiado.'
                  : 'La devolución de IVA se presenta como beneficio estimado aparte: no está descontada del precio ni del monto financiado. Sujeta al cumplimiento de los requisitos correspondientes.'}
              </p>
            </Seccion>
          )}

          {(project.caracteristicas.length > 0 || project.amenities.length > 0) && (
            <Seccion titulo="Características del proyecto">
              <div className="grid grid-2 small">
                {project.caracteristicas.length > 0 && (
                  <ul className="stack stack-xs">
                    {project.caracteristicas.map((c) => (
                      <li key={c}>— {c}</li>
                    ))}
                  </ul>
                )}
                {project.amenities.length > 0 && (
                  <ul className="stack stack-xs">
                    {project.amenities.map((a) => (
                      <li key={a}>— {a}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Seccion>
          )}

          <footer style={{ marginTop: 26 }}>
            {(brand?.contactoNombre || brand?.contactoEmail || brand?.contactoTelefono) && (
              <p className="small" style={{ marginBottom: 10 }}>
                <strong>{brand?.contactoNombre}</strong>
                {brand?.contactoEmail && ` · ${brand.contactoEmail}`}
                {brand?.contactoTelefono && ` · ${brand.contactoTelefono}`}
              </p>
            )}
            <p className="disclaimer">{settings?.disclaimer}</p>
          </footer>
        </div>
      </article>
    </div>
  );
}
