import { useState } from 'react';
import { useStore } from '../../data/store';
import { formatPct } from '../../domain/money';
import type { Project, ProjectConfig } from '../../domain/types';
import {
  Card,
  Checkbox,
  Field,
  Note,
  NumberInput,
  Select,
  useToast,
} from '../../components/ui';

/** Editor de una lista de porcentajes (tasas) o enteros (plazos). */
function ListaNumeros({
  label,
  hint,
  items,
  onChange,
  esPorcentaje,
  sufijo,
}: {
  label: string;
  hint?: string;
  items: number[];
  onChange: (items: number[]) => void;
  esPorcentaje?: boolean;
  sufijo?: string;
}) {
  const mostrar = (n: number) => (esPorcentaje ? Math.round(n * 10000) / 100 : n);
  const guardar = (n: number) => (esPorcentaje ? n / 100 : n);

  return (
    <Field label={label} hint={hint}>
      <div className="stack stack-xs">
        {items.map((v, i) => (
          <div key={i} className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
            <div className="grow">
              <NumberInput
                value={mostrar(v)}
                onChange={(n) =>
                  onChange(items.map((x, j) => (j === i ? guardar(n ?? 0) : x)))
                }
                suffix={esPorcentaje ? '%' : sufijo}
              />
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label="Quitar"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onChange([...items, items.length ? items[items.length - 1] : 0])}
        >
          Agregar
        </button>
      </div>
    </Field>
  );
}

export default function ConditionsEditor({ project }: { project: Project }) {
  const { saveProject } = useStore();
  const toast = useToast();
  const [cfg, setCfg] = useState<ProjectConfig>(project.config);

  const set = <K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) =>
    setCfg((c) => ({ ...c, [key]: value }));

  const guardar = async () => {
    const errores: string[] = [];
    if (cfg.financiamiento.length === 0) errores.push('Debe haber al menos una opción de financiamiento.');
    if (cfg.tasas.length === 0) errores.push('Debe haber al menos una tasa hipotecaria.');
    if (cfg.plazosAnios.length === 0) errores.push('Debe haber al menos un plazo hipotecario.');
    if (cfg.bonoPie.enabled && cfg.bonoPie.minPct > cfg.bonoPie.maxPct)
      errores.push('El mínimo del bono pie no puede superar al máximo.');
    if (cfg.iva.enabled && cfg.iva.minPct > cfg.iva.maxPct)
      errores.push('El mínimo de devolución de IVA no puede superar al máximo.');
    if (cfg.arriendo.minCLP > cfg.arriendo.maxCLP)
      errores.push('El arriendo mínimo no puede superar al máximo.');
    if (cfg.creditoDirecto.enabled && cfg.creditoDirecto.plazos.length === 0)
      errores.push('Debe definir al menos un plazo de crédito directo.');
    if (cfg.cashflow.horizontes.length === 0)
      errores.push('Debe definir al menos un año a proyectar en el cash flow.');
    if (errores.length > 0) {
      toast(errores[0], 'error');
      return;
    }

    const normalizado: ProjectConfig = {
      ...cfg,
      financiamiento: [...new Set(cfg.financiamiento)].sort((a, b) => b - a),
      tasas: [...new Set(cfg.tasas)].sort((a, b) => a - b),
      plazosAnios: [...new Set(cfg.plazosAnios)].sort((a, b) => a - b),
      creditoDirecto: {
        ...cfg.creditoDirecto,
        plazos: [...new Set(cfg.creditoDirecto.plazos)].sort((a, b) => a - b),
      },
      cashflow: {
        ...cfg.cashflow,
        horizontes: [...new Set(cfg.cashflow.horizontes)].sort((a, b) => a - b),
      },
    };
    // Los valores por defecto deben existir dentro de las opciones.
    if (!normalizado.financiamiento.includes(normalizado.financiamientoDefault))
      normalizado.financiamientoDefault = normalizado.financiamiento[0];
    if (!normalizado.plazosAnios.includes(normalizado.plazoDefaultAnios))
      normalizado.plazoDefaultAnios = normalizado.plazosAnios[normalizado.plazosAnios.length - 1];
    if (!normalizado.creditoDirecto.plazos.includes(normalizado.creditoDirecto.defaultPlazo))
      normalizado.creditoDirecto.defaultPlazo =
        normalizado.creditoDirecto.plazos[normalizado.creditoDirecto.plazos.length - 1];

    await saveProject({ ...project, config: normalizado });
    setCfg(normalizado);
    toast('Condiciones comerciales guardadas', 'ok');
  };

  return (
    <div className="stack stack-md">
      <Note tone="info">
        Estas condiciones son <strong>propias de {project.nombre}</strong>. Otro proyecto puede tener
        bono pie o no, ofrecer crédito directo o no, y permitir distintos porcentajes de
        financiamiento.
      </Note>

      <Card title="Bono pie">
        <div className="stack stack-md">
          <Checkbox
            checked={cfg.bonoPie.enabled}
            onChange={(v) => set('bonoPie', { ...cfg.bonoPie, enabled: v })}
            label="Este proyecto ofrece bono pie"
          />
          {cfg.bonoPie.enabled && (
            <div className="grid grid-3">
              <Field label="Mínimo">
                <NumberInput
                  value={cfg.bonoPie.minPct * 100}
                  onChange={(v) => set('bonoPie', { ...cfg.bonoPie, minPct: (v ?? 0) / 100 })}
                  suffix="%"
                />
              </Field>
              <Field label="Máximo">
                <NumberInput
                  value={cfg.bonoPie.maxPct * 100}
                  onChange={(v) => set('bonoPie', { ...cfg.bonoPie, maxPct: (v ?? 0) / 100 })}
                  suffix="%"
                />
              </Field>
              <Field label="Valor inicial del cotizador">
                <NumberInput
                  value={cfg.bonoPie.defaultPct * 100}
                  onChange={(v) => set('bonoPie', { ...cfg.bonoPie, defaultPct: (v ?? 0) / 100 })}
                  suffix="%"
                />
              </Field>
            </div>
          )}
        </div>
      </Card>

      <Card title="Financiamiento hipotecario">
        <div className="grid grid-2">
          <ListaNumeros
            label="Opciones de financiamiento"
            hint="Porcentaje del precio que financia el banco (ej: 90 y 80)."
            items={cfg.financiamiento}
            onChange={(v) => set('financiamiento', v)}
            esPorcentaje
          />
          <div className="stack stack-md">
            <Field label="Opción por defecto">
              <Select
                value={cfg.financiamientoDefault}
                onChange={(v) => set('financiamientoDefault', v)}
                options={cfg.financiamiento.map((f) => ({
                  value: f,
                  label: formatPct(f, 0),
                }))}
              />
            </Field>
            <Field
              label="Pie inicial/directo dentro del pie total"
              hint="Se usa para describir cómo se estructura el pie en la opción 80%."
            >
              <NumberInput
                value={cfg.pieDirectoPct * 100}
                onChange={(v) => set('pieDirectoPct', (v ?? 0) / 100)}
                suffix="%"
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Crédito directo inmobiliario">
        <div className="stack stack-md">
          <Checkbox
            checked={cfg.creditoDirecto.enabled}
            onChange={(v) => set('creditoDirecto', { ...cfg.creditoDirecto, enabled: v })}
            label="Este proyecto ofrece crédito directo inmobiliario"
          />
          {cfg.creditoDirecto.enabled && (
            <>
              <div className="grid grid-3">
                <Field label="Tope sobre el precio">
                  <NumberInput
                    value={cfg.creditoDirecto.maxPct * 100}
                    onChange={(v) =>
                      set('creditoDirecto', { ...cfg.creditoDirecto, maxPct: (v ?? 0) / 100 })
                    }
                    suffix="%"
                  />
                </Field>
                <Field label="Valor inicial del cotizador">
                  <NumberInput
                    value={cfg.creditoDirecto.defaultPct * 100}
                    onChange={(v) =>
                      set('creditoDirecto', { ...cfg.creditoDirecto, defaultPct: (v ?? 0) / 100 })
                    }
                    suffix="%"
                  />
                </Field>
                <Field label="Tasa anual" hint="0% = sin interés.">
                  <NumberInput
                    value={cfg.creditoDirecto.tasaAnual * 100}
                    onChange={(v) =>
                      set('creditoDirecto', { ...cfg.creditoDirecto, tasaAnual: (v ?? 0) / 100 })
                    }
                    suffix="%"
                  />
                </Field>
              </div>
              <div className="grid grid-2">
                <ListaNumeros
                  label="Plazos disponibles"
                  hint="Número de cuotas."
                  items={cfg.creditoDirecto.plazos}
                  onChange={(v) => set('creditoDirecto', { ...cfg.creditoDirecto, plazos: v })}
                  sufijo="cuotas"
                />
                <Field label="Plazo por defecto">
                  <Select
                    value={cfg.creditoDirecto.defaultPlazo}
                    onChange={(v) => set('creditoDirecto', { ...cfg.creditoDirecto, defaultPlazo: v })}
                    options={cfg.creditoDirecto.plazos.map((p) => ({
                      value: p,
                      label: `${p} cuotas`,
                    }))}
                  />
                </Field>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card title="Tasas y plazos hipotecarios">
        <div className="grid grid-3">
          <ListaNumeros
            label="Tasas a simular"
            hint="Se muestran todas simultáneamente en el cotizador."
            items={cfg.tasas}
            onChange={(v) => set('tasas', v)}
            esPorcentaje
          />
          <ListaNumeros
            label="Plazos"
            items={cfg.plazosAnios}
            onChange={(v) => set('plazosAnios', v)}
            sufijo="años"
          />
          <div className="stack stack-md">
            <Field label="Plazo por defecto">
              <Select
                value={cfg.plazoDefaultAnios}
                onChange={(v) => set('plazoDefaultAnios', v)}
                options={cfg.plazosAnios.map((p) => ({ value: p, label: `${p} años` }))}
              />
            </Field>
            <Field
              label="Convención de tasa"
              hint="Cómo se convierte la tasa anual a tasa mensual para calcular el dividendo."
            >
              <Select
                value={cfg.convencionTasa}
                onChange={(v) => set('convencionTasa', v)}
                options={[
                  { value: 'efectivaAnual', label: 'Efectiva anual — (1+i)^(1/12)−1' },
                  { value: 'nominalAnual', label: 'Nominal anual — i/12' },
                ]}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Devolución de IVA">
        <div className="stack stack-md">
          <Checkbox
            checked={cfg.iva.enabled}
            onChange={(v) => set('iva', { ...cfg.iva, enabled: v })}
            label="Este proyecto contempla devolución de IVA"
          />
          {cfg.iva.enabled && (
            <>
              <div className="grid grid-4">
                <Field label="Mínimo">
                  <NumberInput
                    value={cfg.iva.minPct * 100}
                    onChange={(v) => set('iva', { ...cfg.iva, minPct: (v ?? 0) / 100 })}
                    suffix="%"
                  />
                </Field>
                <Field label="Máximo">
                  <NumberInput
                    value={cfg.iva.maxPct * 100}
                    onChange={(v) => set('iva', { ...cfg.iva, maxPct: (v ?? 0) / 100 })}
                    suffix="%"
                  />
                </Field>
                <Field label="Valor inicial">
                  <NumberInput
                    value={cfg.iva.defaultPct * 100}
                    onChange={(v) => set('iva', { ...cfg.iva, defaultPct: (v ?? 0) / 100 })}
                    suffix="%"
                  />
                </Field>
                <Field label="Base de cálculo">
                  <Select
                    value={cfg.iva.base}
                    onChange={(v) => set('iva', { ...cfg.iva, base: v })}
                    options={[
                      { value: 'precioConDescuento', label: 'Precio con descuento' },
                      { value: 'precioLista', label: 'Precio lista' },
                    ]}
                  />
                </Field>
              </div>
              <Checkbox
                checked={cfg.iva.aplicarAlFinanciamiento}
                onChange={(v) => set('iva', { ...cfg.iva, aplicarAlFinanciamiento: v })}
                label="Descontar la devolución del precio financiado"
                hint="Por defecto desactivado: la devolución se muestra como beneficio aparte y no reduce el crédito ni el pie."
              />
            </>
          )}
        </div>
      </Card>

      <Card
        title="Arriendo mensual estimado"
        desc="Rango del selector que usa el broker. Siempre puede ingresar un monto manual fuera del rango."
      >
        <div className="grid grid-4">
          <Field label="Mínimo">
            <NumberInput
              value={cfg.arriendo.minCLP}
              onChange={(v) => set('arriendo', { ...cfg.arriendo, minCLP: v ?? 0 })}
              suffix="$"
            />
          </Field>
          <Field label="Máximo">
            <NumberInput
              value={cfg.arriendo.maxCLP}
              onChange={(v) => set('arriendo', { ...cfg.arriendo, maxCLP: v ?? 0 })}
              suffix="$"
            />
          </Field>
          <Field label="Incremento">
            <NumberInput
              value={cfg.arriendo.stepCLP}
              onChange={(v) => set('arriendo', { ...cfg.arriendo, stepCLP: v ?? 10000 })}
              suffix="$"
            />
          </Field>
          <Field label="Valor inicial" hint="Vacío = el broker debe ingresarlo.">
            <NumberInput
              value={cfg.arriendo.defaultCLP}
              onChange={(v) => set('arriendo', { ...cfg.arriendo, defaultCLP: v })}
              suffix="$"
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Cash flow y plusvalía"
        desc="Valores con que arranca cada cotización. El broker puede ajustarlos caso a caso."
      >
        <div className="stack stack-md">
          <div className="grid grid-4">
            <Field label="Plusvalía anual">
              <NumberInput
                value={cfg.cashflow.plusvaliaAnual * 100}
                onChange={(v) => set('cashflow', { ...cfg.cashflow, plusvaliaAnual: (v ?? 0) / 100 })}
                suffix="%"
              />
            </Field>
            <Field label="Vacancia">
              <NumberInput
                value={cfg.cashflow.vacanciaPct * 100}
                onChange={(v) => set('cashflow', { ...cfg.cashflow, vacanciaPct: (v ?? 0) / 100 })}
                suffix="%"
              />
            </Field>
            <Field label="Administración" hint="Sobre el arriendo.">
              <NumberInput
                value={cfg.cashflow.administracionPct * 100}
                onChange={(v) =>
                  set('cashflow', { ...cfg.cashflow, administracionPct: (v ?? 0) / 100 })
                }
                suffix="%"
              />
            </Field>
            <Field label="Gastos comunes" hint="Mensuales.">
              <NumberInput
                value={cfg.cashflow.gastosComunesCLP || null}
                onChange={(v) => set('cashflow', { ...cfg.cashflow, gastosComunesCLP: v ?? 0 })}
                suffix="$"
              />
            </Field>
            <Field label="Contribuciones" hint="Anuales.">
              <NumberInput
                value={cfg.cashflow.contribucionesCLPAnual || null}
                onChange={(v) =>
                  set('cashflow', { ...cfg.cashflow, contribucionesCLPAnual: v ?? 0 })
                }
                suffix="$"
              />
            </Field>
            <Field label="Seguros" hint="Mensuales.">
              <NumberInput
                value={cfg.cashflow.segurosCLPMensual || null}
                onChange={(v) => set('cashflow', { ...cfg.cashflow, segurosCLPMensual: v ?? 0 })}
                suffix="$"
              />
            </Field>
            <Field label="Fondo puesta en marcha" hint="Por departamento.">
              <NumberInput
                value={cfg.cashflow.fondoPuestaEnMarchaUF || null}
                onChange={(v) => set('cashflow', { ...cfg.cashflow, fondoPuestaEnMarchaUF: v ?? 0 })}
                suffix="UF"
              />
            </Field>
            <Field label="Fondo por estacionamiento">
              <NumberInput
                value={cfg.cashflow.fondoPorEstacionamientoUF || null}
                onChange={(v) =>
                  set('cashflow', { ...cfg.cashflow, fondoPorEstacionamientoUF: v ?? 0 })
                }
                suffix="UF"
              />
            </Field>
          </div>
          <ListaNumeros
            label="Años a proyectar"
            hint="Horizontes que se muestran en la proyección."
            items={cfg.cashflow.horizontes}
            onChange={(v) => set('cashflow', { ...cfg.cashflow, horizontes: v })}
            sufijo="años"
          />
        </div>
      </Card>

      <div className="row-between card card-pad">
        <span className="small muted">Los cambios afectan a las cotizaciones nuevas.</span>
        <button className="btn btn-primary" onClick={guardar}>
          Guardar condiciones
        </button>
      </div>
    </div>
  );
}
