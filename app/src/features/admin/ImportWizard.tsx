import { useMemo, useRef, useState } from 'react';
import { useStore } from '../../data/store';
import { readWorkbook, type SheetData, type WorkbookData } from '../../data/excel/parse';
import { FIELD_SPECS, autoMap, type CanonicalField } from '../../data/excel/mapping';
import { applyPreview, buildPreview, type ImportPreview } from '../../data/excel/diff';
import { EMPTY, formatPct, formatUF } from '../../domain/money';
import type { Project } from '../../domain/types';
import {
  Badge,
  Card,
  Field,
  Note,
  Segmented,
  Select,
  Stat,
  StatusBadge,
  useToast,
} from '../../components/ui';

type Paso = 'archivo' | 'mapeo' | 'preview';

const KIND_LABEL: Record<string, { label: string; tone: 'ok' | 'accent' | 'warn' | 'neutral' | 'danger' }> = {
  nueva: { label: 'Nueva', tone: 'ok' },
  actualizada: { label: 'Actualizada', tone: 'accent' },
  estado: { label: 'Cambio de estado', tone: 'warn' },
  'sin-cambios': { label: 'Sin cambios', tone: 'neutral' },
  invalida: { label: 'No importable', tone: 'danger' },
};

export default function ImportWizard({ projects }: { projects: Project[] }) {
  const { units, replaceUnits } = useStore();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [paso, setPaso] = useState<Paso>('archivo');
  const [workbook, setWorkbook] = useState<WorkbookData | null>(null);
  const [hojaIdx, setHojaIdx] = useState(0);
  const [mapping, setMapping] = useState<Record<string, CanonicalField | null>>({});
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [filtroProyecto, setFiltroProyecto] = useState<string>('');
  const [accionAusentes, setAccionAusentes] = useState<'conservar' | 'bloquear' | 'eliminar'>(
    'conservar',
  );
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [verTodas, setVerTodas] = useState(false);
  const [cargando, setCargando] = useState(false);

  const hoja: SheetData | null = workbook?.sheets[hojaIdx] ?? null;

  const valoresProyectoEnPlanilla = useMemo(() => {
    if (!hoja) return [];
    const col = Object.entries(mapping).find(([, f]) => f === 'proyecto')?.[0];
    if (!col) return [];
    const set = new Set<string>();
    for (const r of hoja.rows) {
      const v = r[col];
      if (v != null && String(v).trim()) set.add(String(v).trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [hoja, mapping]);

  const onArchivo = async (file: File) => {
    setCargando(true);
    try {
      const wb = await readWorkbook(file);
      if (wb.sheets.length === 0) {
        toast('No se encontraron hojas con datos en el archivo.', 'error');
        return;
      }
      setWorkbook(wb);
      setHojaIdx(0);
      setMapping(autoMap(wb.sheets[0].headers));
      setFiltroProyecto('');
      setPreview(null);
      setPaso('mapeo');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No fue posible leer el archivo.', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cambiarHoja = (idx: number) => {
    setHojaIdx(idx);
    const s = workbook?.sheets[idx];
    if (s) setMapping(autoMap(s.headers));
    setPreview(null);
  };

  const generarPreview = () => {
    if (!hoja || !projectId) return;
    const p = buildPreview({
      sheet: hoja,
      mapping,
      projectId,
      unidadesActuales: units,
      filtroProyecto: filtroProyecto || null,
    });
    setPreview(p);
    setPaso('preview');
  };

  const confirmar = async () => {
    if (!preview || !projectId) return;
    const next = applyPreview({
      preview,
      projectId,
      unidadesActuales: units,
      accionAusentes,
    });
    await replaceUnits(next);
    toast(
      `Stock actualizado: ${preview.nuevas} nuevas, ${preview.actualizadas} actualizadas, ${preview.cambiosDeEstado} cambios de estado.`,
      'ok',
    );
    setPaso('archivo');
    setWorkbook(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const camposObligatorios = FIELD_SPECS.filter((f) => f.requerido).map((f) => f.field);
  const mapeados = new Set(Object.values(mapping).filter(Boolean) as CanonicalField[]);
  const faltantes = camposObligatorios.filter((f) => !mapeados.has(f));

  return (
    <div className="stack stack-md">
      <Card
        title="Importar / actualizar stock"
        desc="Cargue la planilla Excel del proyecto. Antes de modificar nada verá exactamente qué va a cambiar."
      >
        <div className="stack stack-md">
          <div className="row">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.xlsm"
              className="input"
              style={{ maxWidth: 340 }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onArchivo(f);
              }}
            />
            {cargando && <span className="small muted">Leyendo archivo…</span>}
            {workbook && (
              <Badge tone="accent">
                {workbook.fileName} · {workbook.sheets.length} hoja
                {workbook.sheets.length === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
          <Note tone="muted">
            Formatos aceptados: .xlsx, .xlsm, .xls y .csv. El archivo se procesa{' '}
            <strong>en su navegador</strong>: no se envía a ningún servidor.
          </Note>
        </div>
      </Card>

      {paso !== 'archivo' && hoja && (
        <Card title="1. Hoja y proyecto de destino">
          <div className="stack stack-md">
            {workbook!.sheets.length > 1 && (
              <Field label="Hoja de la planilla">
                <Segmented
                  label="Hoja"
                  value={hojaIdx}
                  onChange={cambiarHoja}
                  options={workbook!.sheets.map((s, i) => ({
                    value: i,
                    label: s.nombre,
                    sub: `${s.rows.length} filas`,
                  }))}
                />
              </Field>
            )}

            <div className="grid grid-2">
              <Field
                label="Proyecto de destino"
                hint="Las unidades se cargarán en este proyecto."
              >
                <Select
                  value={projectId}
                  onChange={setProjectId}
                  options={projects.map((p) => ({ value: p.id, label: p.nombre }))}
                />
              </Field>
              {valoresProyectoEnPlanilla.length > 1 && (
                <Field
                  label="Filtrar filas por proyecto de la planilla"
                  hint="La planilla contiene varios proyectos. Elija cuál importar."
                >
                  <Select
                    value={filtroProyecto}
                    onChange={setFiltroProyecto}
                    options={[
                      { value: '', label: 'Todas las filas' },
                      ...valoresProyectoEnPlanilla.map((v) => ({ value: v, label: v })),
                    ]}
                  />
                </Field>
              )}
            </div>

            <p className="small muted">
              {hoja.rows.length} filas de datos · {hoja.headers.length} columnas detectadas.
            </p>
          </div>
        </Card>
      )}

      {paso !== 'archivo' && hoja && (
        <Card
          title="2. Mapeo de columnas"
          desc="El sistema reconoce los encabezados habituales. Corrija lo que haga falta antes de continuar."
        >
          <div className="stack stack-md">
            {faltantes.length > 0 && (
              <Note tone="warn">
                Falta asignar:{' '}
                <strong>
                  {faltantes
                    .map((f) => FIELD_SPECS.find((s) => s.field === f)?.label ?? f)
                    .join(', ')}
                </strong>
                . Sin estas columnas la importación no puede identificar ni valorizar las unidades.
              </Note>
            )}

            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Columna de la planilla</th>
                    <th>Ejemplo</th>
                    <th>Campo del sistema</th>
                  </tr>
                </thead>
                <tbody>
                  {hoja.headers.map((h) => {
                    const ejemplo = hoja.rows.find((r) => r[h] != null && String(r[h]).trim() !== '')?.[h];
                    return (
                      <tr key={h}>
                        <td style={{ fontWeight: 600 }}>{h}</td>
                        <td className="dim">{ejemplo != null ? String(ejemplo) : EMPTY}</td>
                        <td>
                          <select
                            className="select"
                            value={mapping[h] ?? ''}
                            onChange={(e) => {
                              const field = (e.target.value || null) as CanonicalField | null;
                              setMapping((m) => {
                                const next = { ...m };
                                // Un campo sólo puede venir de una columna.
                                if (field) {
                                  for (const k of Object.keys(next)) {
                                    if (next[k] === field) next[k] = null;
                                  }
                                }
                                next[h] = field;
                                return next;
                              });
                              setPreview(null);
                            }}
                          >
                            <option value="">— No importar —</option>
                            {FIELD_SPECS.map((s) => (
                              <option key={s.field} value={s.field}>
                                {s.label}
                                {s.requerido ? ' *' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Note tone="muted">
              Las columnas marcadas «No importar» <strong>no se pierden</strong>: se guardan junto a
              la unidad y se muestran en el cotizador como datos adicionales de la planilla.
            </Note>

            <div className="row">
              <button
                className="btn btn-primary"
                disabled={faltantes.length > 0 || !projectId}
                onClick={generarPreview}
              >
                Generar vista previa
              </button>
            </div>
          </div>
        </Card>
      )}

      {paso === 'preview' && preview && (
        <Card
          title="3. Vista previa de la actualización"
          desc="Nada se ha modificado todavía. Revise el detalle y confirme."
        >
          <div className="stack stack-md">
            <div className="grid grid-4">
              <Stat label="Unidades encontradas" value={preview.totalFilas} tone="dark" />
              <Stat label="Nuevas" value={preview.nuevas} />
              <Stat label="Actualizadas" value={preview.actualizadas} />
              <Stat label="Cambios de estado" value={preview.cambiosDeEstado} />
            </div>
            <div className="grid grid-3">
              <Stat label="Sin cambios" value={preview.sinCambios} tone="plain" />
              <Stat label="No importables" value={preview.invalidas} tone="plain" />
              <Stat label="Ausentes en la planilla" value={preview.ausentes.length} tone="plain" />
            </div>

            {preview.ausentes.length > 0 && (
              <Field
                label={`${preview.ausentes.length} unidades del stock no aparecen en la planilla`}
                hint="Elija qué hacer con ellas. Por defecto se conservan intactas."
              >
                <Segmented
                  label="Unidades ausentes"
                  value={accionAusentes}
                  onChange={setAccionAusentes}
                  options={[
                    { value: 'conservar', label: 'Conservar' },
                    { value: 'bloquear', label: 'Marcar bloqueadas' },
                    { value: 'eliminar', label: 'Eliminar' },
                  ]}
                />
              </Field>
            )}

            {preview.invalidas > 0 && (
              <Note tone="warn">
                {preview.invalidas} filas no se importarán por no tener identificador de
                departamento. Revise el mapeo de columnas si no es lo esperado.
              </Note>
            )}

            <div className="table-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Depto</th>
                    <th>Resultado</th>
                    <th className="num">Precio lista</th>
                    <th className="num">Dcto.</th>
                    <th className="num">Precio final</th>
                    <th>Estado</th>
                    <th>Cambios</th>
                  </tr>
                </thead>
                <tbody>
                  {(verTodas ? preview.rows : preview.rows.slice(0, 60)).map((r) => {
                    const meta = KIND_LABEL[r.kind];
                    return (
                      <tr key={`${r.fila}-${r.departamento}`}>
                        <td className="dim">{r.fila}</td>
                        <td style={{ fontWeight: 600 }}>{r.departamento}</td>
                        <td>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </td>
                        <td className="num">{formatUF(r.resultante?.precioListaUF ?? null)}</td>
                        <td className="num">
                          {r.resultante?.descuentoPct != null
                            ? formatPct(r.resultante.descuentoPct)
                            : EMPTY}
                        </td>
                        <td className="num">
                          {formatUF(r.resultante?.precioConDescuentoUF ?? null)}
                        </td>
                        <td>
                          {r.resultante && (
                            <StatusBadge
                              estado={r.resultante.estado}
                              title={r.resultante.estadoOriginal ?? undefined}
                            />
                          )}
                        </td>
                        <td className="xs dim" style={{ whiteSpace: 'normal', minWidth: 220 }}>
                          {r.errores.length > 0 && (
                            <span className="neg">{r.errores.join(' ')} </span>
                          )}
                          {r.cambios
                            .map(
                              (c) =>
                                `${c.label}: ${fmt(c.antes)} → ${fmt(c.despues)}`,
                            )
                            .join(' · ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {preview.rows.length > 60 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setVerTodas((v) => !v)}>
                {verTodas ? 'Mostrar sólo las primeras 60' : `Ver las ${preview.rows.length} filas`}
              </button>
            )}

            <div className="row">
              <button className="btn btn-accent btn-lg" onClick={confirmar}>
                Confirmar y actualizar stock
              </button>
              <button className="btn btn-ghost" onClick={() => setPaso('mapeo')}>
                Volver al mapeo
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function fmt(v: unknown): string {
  if (v == null || v === '') return EMPTY;
  if (typeof v === 'number') return String(Math.round(v * 100) / 100);
  return String(v);
}
