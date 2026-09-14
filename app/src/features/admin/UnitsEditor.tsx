import { useMemo, useState } from 'react';
import { useStore } from '../../data/store';
import { pricingFromUnit } from '../../domain/finance';
import { emptyUnit, superficieTotal } from '../../domain/units';
import { EMPTY, formatM2, formatPct, formatUF } from '../../domain/money';
import { UNIT_STATUSES, type Project, type Unit, type UnitStatus } from '../../domain/types';
import {
  Card,
  Empty,
  Field,
  Modal,
  Note,
  NumberInput,
  Select,
  StatusBadge,
  TextInput,
  useToast,
} from '../../components/ui';

function UnitForm({
  unit,
  onChange,
}: {
  unit: Unit;
  onChange: (u: Unit) => void;
}) {
  const set = <K extends keyof Unit>(key: K, value: Unit[K]) => onChange({ ...unit, [key]: value });
  const pricing = pricingFromUnit(unit);

  return (
    <div className="stack stack-md">
      <div className="grid grid-3">
        <Field label="Departamento">
          <TextInput value={unit.departamento} onChange={(v) => set('departamento', v)} />
        </Field>
        <Field label="Piso">
          <NumberInput value={unit.piso} onChange={(v) => set('piso', v)} />
        </Field>
        <Field label="Modelo">
          <TextInput value={unit.modelo ?? ''} onChange={(v) => set('modelo', v || null)} />
        </Field>
        <Field label="Tipología">
          <TextInput value={unit.tipologia ?? ''} onChange={(v) => set('tipologia', v || null)} />
        </Field>
        <Field label="Dormitorios">
          <NumberInput value={unit.dormitorios} onChange={(v) => set('dormitorios', v)} />
        </Field>
        <Field label="Baños">
          <NumberInput value={unit.banos} onChange={(v) => set('banos', v)} />
        </Field>
        <Field label="Orientación">
          <TextInput value={unit.orientacion ?? ''} onChange={(v) => set('orientacion', v || null)} />
        </Field>
        <Field label="Sup. útil (m²)">
          <NumberInput value={unit.superficieUtil} onChange={(v) => set('superficieUtil', v)} />
        </Field>
        <Field label="Terraza (m²)">
          <NumberInput value={unit.superficieTerraza} onChange={(v) => set('superficieTerraza', v)} />
        </Field>
        <Field label="Sup. total (m²)" hint="Vacío = útil + terraza.">
          <NumberInput value={unit.superficieTotal} onChange={(v) => set('superficieTotal', v)} />
        </Field>
        <Field label="Estado">
          <Select
            value={unit.estado}
            onChange={(v) => set('estado', v as UnitStatus)}
            options={UNIT_STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </Field>
        <Field label="Bono pie de la unidad" hint="Vacío = usa el del proyecto.">
          <NumberInput
            value={unit.bonoPiePct != null ? unit.bonoPiePct * 100 : null}
            onChange={(v) => set('bonoPiePct', v == null ? null : v / 100)}
            suffix="%"
          />
        </Field>
      </div>

      <div className="divider" />

      <div className="grid grid-4">
        <Field label="Precio lista (UF)">
          <NumberInput value={unit.precioListaUF} onChange={(v) => set('precioListaUF', v)} />
        </Field>
        <Field label="Descuento (%)">
          <NumberInput
            value={unit.descuentoPct != null ? unit.descuentoPct * 100 : null}
            onChange={(v) => set('descuentoPct', v == null ? null : v / 100)}
            suffix="%"
          />
        </Field>
        <Field label="Descuento (UF)">
          <NumberInput value={unit.descuentoMontoUF} onChange={(v) => set('descuentoMontoUF', v)} />
        </Field>
        <Field label="Precio con descuento (UF)" hint="Si se ingresa, manda sobre el cálculo.">
          <NumberInput
            value={unit.precioConDescuentoUF}
            onChange={(v) => set('precioConDescuentoUF', v)}
          />
        </Field>
      </div>

      <Note tone={pricing.warnings.length ? 'warn' : 'muted'}>
        <span>
          Resultado: <strong>{formatUF(pricing.precioConDescuentoUF)}</strong> ·{' '}
          {pricing.detalleDescuento}
          {pricing.warnings.length > 0 && <> — {pricing.warnings.join(' ')}</>}
        </span>
      </Note>
    </div>
  );
}

export default function UnitsEditor({ project }: { project: Project }) {
  const { unitsOf, saveUnit, deleteUnit, replaceUnits, units: todas } = useStore();
  const toast = useToast();
  const units = useMemo(() => unitsOf(project.id), [unitsOf, project.id]);

  const [editando, setEditando] = useState<Unit | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const visibles = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    const filtradas = t
      ? units.filter((u) =>
          [u.departamento, u.modelo, u.tipologia, u.orientacion, u.estado].some(
            (c) => c && String(c).toLowerCase().includes(t),
          ),
        )
      : units;
    return [...filtradas].sort((a, b) =>
      a.departamento.localeCompare(b.departamento, 'es', { numeric: true }),
    );
  }, [units, busqueda]);

  const guardar = async () => {
    if (!editando) return;
    if (!editando.departamento.trim()) {
      toast('La unidad necesita un número de departamento.', 'error');
      return;
    }
    const duplicada = units.some(
      (u) =>
        u.id !== editando.id &&
        u.departamento.trim().toUpperCase() === editando.departamento.trim().toUpperCase(),
    );
    if (duplicada) {
      toast(`Ya existe una unidad ${editando.departamento} en este proyecto.`, 'error');
      return;
    }
    await saveUnit({ ...editando, source: 'manual' });
    toast('Unidad guardada', 'ok');
    setEditando(null);
  };

  const exportarCsv = () => {
    const cols = [
      'Departamento', 'Piso', 'Modelo', 'Tipología', 'Dormitorios', 'Baños', 'Orientación',
      'Superficie útil', 'Terraza', 'Superficie total', 'Precio lista UF', 'Descuento %',
      'Descuento UF', 'Precio con descuento UF', 'Estado', 'Estado original',
    ];
    const filas = visibles.map((u) => [
      u.departamento, u.piso, u.modelo, u.tipologia, u.dormitorios, u.banos, u.orientacion,
      u.superficieUtil, u.superficieTerraza, u.superficieTotal, u.precioListaUF,
      u.descuentoPct != null ? u.descuentoPct * 100 : null, u.descuentoMontoUF,
      u.precioConDescuentoUF, u.estado, u.estadoOriginal,
    ]);
    const csv = [cols, ...filas]
      .map((f) => f.map((c) => (c == null ? '' : `"${String(c).replace(/"/g, '""')}"`)).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `stock-${project.id}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="stack stack-md">
      <Card
        title={`Unidades de ${project.nombre}`}
        desc="Normalmente se cargan por importación de Excel. Aquí puede corregir casos puntuales."
        aside={
          <>
            <button className="btn btn-outline btn-sm" onClick={exportarCsv} disabled={units.length === 0}>
              Exportar CSV
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setEditando(emptyUnit(project.id, ''))}
            >
              Nueva unidad
            </button>
          </>
        }
      >
        <div className="stack stack-md">
          <div className="row">
            <div className="grow" style={{ maxWidth: 320 }}>
              <TextInput
                value={busqueda}
                onChange={setBusqueda}
                placeholder="Buscar departamento, modelo, estado…"
              />
            </div>
            <span className="small muted">
              {visibles.length} de {units.length} unidades
            </span>
            {units.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (
                    confirm(
                      `¿Eliminar las ${units.length} unidades de ${project.nombre}? Esta acción no se puede deshacer.`,
                    )
                  ) {
                    void replaceUnits(todas.filter((u) => u.projectId !== project.id)).then(() =>
                      toast('Stock del proyecto eliminado', 'ok'),
                    );
                  }
                }}
              >
                Vaciar stock
              </button>
            )}
          </div>

          {units.length === 0 ? (
            <Empty titulo="Sin unidades">
              Importe la planilla Excel del proyecto desde la pestaña «Importar stock», o cree una
              unidad manualmente.
            </Empty>
          ) : (
            <div className="table-wrap" style={{ maxHeight: 520, overflowY: 'auto' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>Depto</th>
                    <th className="num">Piso</th>
                    <th>Tipología</th>
                    <th>Orient.</th>
                    <th className="num">Sup. total</th>
                    <th className="num">Precio lista</th>
                    <th className="num">Dcto.</th>
                    <th className="num">Precio final</th>
                    <th>Estado</th>
                    <th>Origen</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((u) => {
                    const p = pricingFromUnit(u);
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.departamento}</td>
                        <td className="num">{u.piso ?? EMPTY}</td>
                        <td>{u.tipologia ?? EMPTY}</td>
                        <td>{u.orientacion ?? EMPTY}</td>
                        <td className="num">{formatM2(superficieTotal(u))}</td>
                        <td className="num">{formatUF(p.precioListaUF)}</td>
                        <td className="num">
                          {p.descuentoMontoUF > 0 ? formatPct(p.descuentoPct) : EMPTY}
                        </td>
                        <td className="num" style={{ fontWeight: 600 }}>
                          {formatUF(p.precioConDescuentoUF)}
                        </td>
                        <td>
                          <StatusBadge estado={u.estado} title={u.estadoOriginal ?? undefined} />
                        </td>
                        <td className="xs dim">{u.source === 'excel' ? 'Planilla' : 'Manual'}</td>
                        <td>
                          <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => setEditando(u)}>
                              Editar
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                if (confirm(`¿Eliminar la unidad ${u.departamento}?`)) {
                                  void deleteUnit(u.id);
                                }
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={editando != null}
        onClose={() => setEditando(null)}
        wide
        title={editando?.departamento ? `Unidad ${editando.departamento}` : 'Nueva unidad'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEditando(null)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={guardar}>
              Guardar unidad
            </button>
          </>
        }
      >
        {editando && <UnitForm unit={editando} onChange={setEditando} />}
      </Modal>
    </div>
  );
}
