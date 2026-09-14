import { useState } from 'react';
import type { FilterOptions, UnitFilter } from '../domain/filters';
import { countActiveFilters, emptyFilter } from '../domain/filters';
import { statusLabel } from '../domain/units';
import { Field, NumberInput, TextInput } from './ui';

/** Selector múltiple compacto, en forma de "chips". */
function ChipGroup<T extends string | number>({
  label,
  values,
  selected,
  onChange,
  renderLabel,
}: {
  label: string;
  values: T[];
  selected: T[];
  onChange: (next: T[]) => void;
  renderLabel?: (v: T) => string;
}) {
  if (values.length === 0) return null;
  const toggle = (v: T) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="row" style={{ gap: 6 }}>
        {values.map((v) => (
          <button
            key={String(v)}
            type="button"
            className="segmented-item"
            style={{ flex: 'none', minWidth: 0, padding: '6px 11px', fontSize: 12.5 }}
            aria-pressed={selected.includes(v)}
            onClick={() => toggle(v)}
          >
            {renderLabel ? renderLabel(v) : String(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FilterPanel({
  filter,
  onChange,
  options,
  mostrarProyecto = true,
  compacto = false,
}: {
  filter: UnitFilter;
  onChange: (f: UnitFilter) => void;
  options: FilterOptions;
  mostrarProyecto?: boolean;
  compacto?: boolean;
}) {
  const [abierto, setAbierto] = useState(!compacto);
  const activos = countActiveFilters(filter);
  const set = <K extends keyof UnitFilter>(key: K, value: UnitFilter[K]) =>
    onChange({ ...filter, [key]: value });

  return (
    <div className="card">
      <div className="card-body stack stack-md">
        <div className="row" style={{ gap: 10 }}>
          <div className="grow" style={{ minWidth: 200 }}>
            <TextInput
              value={filter.texto}
              onChange={(v) => set('texto', v)}
              placeholder="Buscar proyecto, comuna, departamento, modelo…"
              aria-label="Buscar"
            />
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setAbierto((a) => !a)}>
            Filtros{activos > 0 ? ` · ${activos}` : ''}
          </button>
          {activos > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => onChange(emptyFilter())}>
              Limpiar
            </button>
          )}
        </div>

        {abierto && (
          <div className="stack stack-md">
            <div className="divider" />
            {mostrarProyecto && options.proyectos.length > 1 && (
              <ChipGroup
                label="Proyecto"
                values={options.proyectos.map((p) => p.id)}
                selected={filter.projectIds}
                onChange={(v) => set('projectIds', v)}
                renderLabel={(id) => options.proyectos.find((p) => p.id === id)?.nombre ?? id}
              />
            )}
            <ChipGroup
              label="Comuna"
              values={options.comunas}
              selected={filter.comunas}
              onChange={(v) => set('comunas', v)}
            />
            <ChipGroup
              label="Tipología"
              values={options.tipologias}
              selected={filter.tipologias}
              onChange={(v) => set('tipologias', v)}
            />
            <div className="grid grid-2">
              <ChipGroup
                label="Dormitorios"
                values={options.dormitorios}
                selected={filter.dormitorios}
                onChange={(v) => set('dormitorios', v)}
                renderLabel={(n) => (n === 0 ? 'Estudio' : String(n))}
              />
              <ChipGroup
                label="Baños"
                values={options.banos}
                selected={filter.banos}
                onChange={(v) => set('banos', v)}
              />
            </div>
            <ChipGroup
              label="Orientación"
              values={options.orientaciones}
              selected={filter.orientaciones}
              onChange={(v) => set('orientaciones', v)}
            />
            <ChipGroup
              label="Piso"
              values={options.pisos}
              selected={filter.pisos}
              onChange={(v) => set('pisos', v)}
            />
            <ChipGroup
              label="Disponibilidad"
              values={options.estados}
              selected={filter.estados}
              onChange={(v) => set('estados', v)}
              renderLabel={(e) => statusLabel(e)}
            />

            <div className="grid grid-2">
              <Field
                label="Precio (UF)"
                hint={
                  options.precioMinUF != null
                    ? `Stock entre ${Math.floor(options.precioMinUF)} y ${Math.ceil(options.precioMaxUF ?? 0)} UF`
                    : 'Sin precios cargados'
                }
              >
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <NumberInput
                    value={filter.precioMinUF}
                    onChange={(v) => set('precioMinUF', v)}
                    placeholder="Desde"
                  />
                  <NumberInput
                    value={filter.precioMaxUF}
                    onChange={(v) => set('precioMaxUF', v)}
                    placeholder="Hasta"
                  />
                </div>
              </Field>
              <Field
                label="Superficie total (m²)"
                hint={
                  options.superficieMin != null
                    ? `Stock entre ${options.superficieMin} y ${options.superficieMax} m²`
                    : 'Sin superficies cargadas'
                }
              >
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <NumberInput
                    value={filter.superficieMin}
                    onChange={(v) => set('superficieMin', v)}
                    placeholder="Desde"
                  />
                  <NumberInput
                    value={filter.superficieMax}
                    onChange={(v) => set('superficieMax', v)}
                    placeholder="Hasta"
                  />
                </div>
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
