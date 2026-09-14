import { useMemo, useState } from 'react';
import { pricingFromUnit } from '../../domain/finance';
import {
  buildFilterOptions,
  emptyFilter,
  matchesUnit,
  type UnitFilter,
} from '../../domain/filters';
import { EMPTY, formatM2, formatPct, formatUF } from '../../domain/money';
import { isCotizable, superficieTotal, tipologiaLabel } from '../../domain/units';
import type { Project, Unit } from '../../domain/types';
import { Empty, Note, StatusBadge } from '../../components/ui';
import FilterPanel from '../../components/FilterPanel';

type SortKey = 'departamento' | 'piso' | 'precio' | 'superficie' | 'tipologia';

export default function UnitPicker({
  project,
  units,
  selectedId,
  onSelect,
}: {
  project: Project;
  units: Unit[];
  selectedId: string | null;
  onSelect: (unit: Unit) => void;
}) {
  const [filter, setFilter] = useState<UnitFilter>(() => ({
    ...emptyFilter(),
    soloCotizables: true,
  }));
  const [sort, setSort] = useState<SortKey>('precio');
  const [asc, setAsc] = useState(true);

  const options = useMemo(() => buildFilterOptions(units, [project]), [units, project]);

  const visibles = useMemo(() => {
    const filtradas = units.filter((u) => matchesUnit(u, filter, project));
    const valor = (u: Unit): number | string => {
      switch (sort) {
        case 'piso':
          return u.piso ?? Number.POSITIVE_INFINITY;
        case 'precio':
          return pricingFromUnit(u).precioConDescuentoUF ?? Number.POSITIVE_INFINITY;
        case 'superficie':
          return superficieTotal(u) ?? Number.POSITIVE_INFINITY;
        case 'tipologia':
          return tipologiaLabel(u) ?? 'zzz';
        default:
          return u.departamento;
      }
    };
    return [...filtradas].sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'es', { numeric: true });
      return asc ? cmp : -cmp;
    });
  }, [units, filter, project, sort, asc]);

  const header = (key: SortKey, label: string, num = false) => (
    <th
      className={num ? 'num' : undefined}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={() => {
        if (sort === key) setAsc((a) => !a);
        else {
          setSort(key);
          setAsc(true);
        }
      }}
      aria-sort={sort === key ? (asc ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      {sort === key && <span aria-hidden> {asc ? '↑' : '↓'}</span>}
    </th>
  );

  if (units.length === 0) {
    return (
      <Empty titulo="Sin stock cargado">
        Este proyecto todavía no tiene unidades. Cárguelas desde{' '}
        <strong>Administrar → Importar stock</strong> usando la planilla Excel del proyecto. El
        sistema no genera unidades ni precios por su cuenta.
      </Empty>
    );
  }

  const cotizables = units.filter(isCotizable).length;

  return (
    <div className="stack stack-md">
      <FilterPanel
        filter={filter}
        onChange={setFilter}
        options={options}
        mostrarProyecto={false}
        compacto
      />

      <div className="row-between">
        <p className="small muted">
          {visibles.length} de {units.length} unidades · {cotizables} cotizables
        </p>
        <label className="checkbox small">
          <input
            type="checkbox"
            checked={filter.soloCotizables}
            onChange={(e) => setFilter({ ...filter, soloCotizables: e.target.checked })}
          />
          <span>Mostrar sólo unidades cotizables</span>
        </label>
      </div>

      {visibles.length === 0 ? (
        <Empty titulo="Ninguna unidad cumple los filtros">
          Ajuste los filtros para ver más unidades del stock.
        </Empty>
      ) : (
        <div className="card">
          <div className="table-wrap" style={{ maxHeight: 460, overflowY: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  {header('departamento', 'Depto')}
                  {header('piso', 'Piso', true)}
                  <th>Modelo</th>
                  {header('tipologia', 'Tipología')}
                  <th>Orient.</th>
                  {header('superficie', 'Sup. total', true)}
                  <th className="num">Precio lista</th>
                  <th className="num">Dcto.</th>
                  {header('precio', 'Precio depto', true)}
                  <th>Adicionales</th>
                  <th className="num">Negocio final</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibles.map((u) => {
                  const p = pricingFromUnit(u);
                  const cotizable = isCotizable(u);
                  return (
                    <tr
                      key={u.id}
                      className={`${u.id === selectedId ? 'is-selected' : ''}${cotizable ? '' : ' is-disabled'}`}
                    >
                      <td style={{ fontWeight: 600 }}>{u.departamento}</td>
                      <td className="num">{u.piso ?? EMPTY}</td>
                      <td>{u.modelo ?? EMPTY}</td>
                      <td>{tipologiaLabel(u) ?? EMPTY}</td>
                      <td>{u.orientacion ?? EMPTY}</td>
                      <td className="num">{formatM2(superficieTotal(u))}</td>
                      <td className="num">
                        {p.descuentoMontoUF > 0 ? (
                          <span className="strike">{formatUF(p.precioListaUF)}</span>
                        ) : (
                          formatUF(p.precioListaUF)
                        )}
                      </td>
                      <td className="num">
                        {p.descuentoMontoUF > 0 ? formatPct(p.descuentoPct) : EMPTY}
                      </td>
                      <td className="num" style={{ fontWeight: 600 }}>
                        {formatUF(p.precioConDescuentoUF)}
                      </td>
                      <td className="xs">
                        {[
                          u.estacionamiento && `Est. ${u.estacionamiento}`,
                          u.estacionamiento2 && `Est. ${u.estacionamiento2}`,
                          u.bodega && `Bod. ${u.bodega}`,
                        ]
                          .filter(Boolean)
                          .join(' · ') || EMPTY}
                      </td>
                      <td className="num">
                        {p.adicionalesUF > 0 ? formatUF(p.precioNegocioFinalUF) : EMPTY}
                      </td>
                      <td>
                        <StatusBadge estado={u.estado} title={u.estadoOriginal ?? undefined} />
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${u.id === selectedId ? 'btn-primary' : 'btn-outline'}`}
                          disabled={!cotizable}
                          title={
                            cotizable
                              ? undefined
                              : u.estado !== 'DISPONIBLE'
                                ? `No cotizable: estado ${u.estado}`
                                : 'No cotizable: sin precio en la planilla'
                          }
                          onClick={() => onSelect(u)}
                        >
                          {u.id === selectedId ? 'Seleccionada' : 'Seleccionar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Note tone="muted">
        Sólo las unidades en estado <strong>DISPONIBLE</strong> y con precio en la planilla pueden
        cotizarse. Los estados y precios son los de la última importación de stock.
      </Note>
    </div>
  );
}
