import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../data/store';
import {
  buildFilterOptions,
  emptyFilter,
  matchesUnit,
  projectStats,
  type UnitFilter,
} from '../../domain/filters';
import { formatM2, formatUF } from '../../domain/money';
import type { Project, Unit } from '../../domain/types';
import { Badge, Empty, Note } from '../../components/ui';
import FilterPanel from '../../components/FilterPanel';

function ProjectCard({ project, units }: { project: Project; units: Unit[] }) {
  const stats = projectStats(units);
  const beneficios = project.beneficios.slice(0, 3);
  const config = project.config;

  // Beneficios derivados de la configuración comercial del proyecto.
  const condiciones: string[] = [];
  if (config.bonoPie.enabled && config.bonoPie.maxPct > 0)
    condiciones.push(`Bono pie hasta ${(config.bonoPie.maxPct * 100).toFixed(0)}%`);
  if (config.creditoDirecto.enabled)
    condiciones.push(
      `Crédito directo hasta ${(config.creditoDirecto.maxPct * 100).toFixed(0)}% en ${Math.max(
        ...config.creditoDirecto.plazos,
      )} cuotas`,
    );
  if (config.financiamiento.length)
    condiciones.push(
      `Financiamiento ${config.financiamiento.map((f) => `${(f * 100).toFixed(0)}%`).join(' / ')}`,
    );

  return (
    <article className="project-card">
      <Link to={`/proyecto/${project.id}`} className="project-media">
        {project.imagenPrincipal ? (
          <img src={project.imagenPrincipal} alt={project.nombre} loading="lazy" />
        ) : (
          <div className="media-empty">
            <span style={{ fontSize: 22 }}>◳</span>
            <span>
              Imagen principal pendiente de carga
              <br />
              (se sube desde el panel administrador)
            </span>
          </div>
        )}
        {stats.cotizables > 0 ? (
          <span className="badge badge-ok">
            <span className="badge-dot" />
            {stats.cotizables} disponibles
          </span>
        ) : (
          <span className="badge badge-neutral">Sin stock cotizable</span>
        )}
      </Link>

      <div className="card-body stack stack-sm grow">
        <div>
          <p className="eyebrow">{project.inmobiliaria ?? 'Inmobiliaria por definir'}</p>
          <h3 style={{ fontSize: 18, fontFamily: 'var(--serif)', marginTop: 2 }}>{project.nombre}</h3>
          <p className="small muted" style={{ marginTop: 3 }}>
            {[project.comuna, project.direccion].filter(Boolean).join(' · ') || 'Ubicación por definir'}
          </p>
        </div>

        <div className="row" style={{ gap: 6 }}>
          {stats.tipologias.length > 0 ? (
            stats.tipologias.slice(0, 4).map((t) => (
              <Badge key={t} tone="neutral">
                {t}
              </Badge>
            ))
          ) : project.tipologias.length > 0 ? (
            project.tipologias.slice(0, 4).map((t) => (
              <Badge key={t.nombre} tone="neutral">
                {t.nombre}
              </Badge>
            ))
          ) : null}
        </div>

        <div className="divider" />

        <div className="row-between">
          <div>
            <span className="stat-label">Precio desde</span>
            <div className="stat-value" style={{ fontSize: 19 }}>
              {stats.precioDesdeUF != null ? formatUF(stats.precioDesdeUF) : '—'}
            </div>
            {stats.superficieDesde != null && (
              <span className="xs dim">Desde {formatM2(stats.superficieDesde)} totales</span>
            )}
          </div>
          <div className="right">
            <span className="stat-label">Stock</span>
            <div className="small mono">
              {stats.total > 0 ? `${stats.disponibles} de ${stats.total}` : 'Sin cargar'}
            </div>
          </div>
        </div>

        {(beneficios.length > 0 || condiciones.length > 0) && (
          <ul className="stack stack-xs xs muted" style={{ marginTop: 2 }}>
            {beneficios.map((b) => (
              <li key={b}>· {b}</li>
            ))}
            {beneficios.length === 0 && condiciones.map((c) => <li key={c}>· {c}</li>)}
          </ul>
        )}

        <div className="row" style={{ marginTop: 'auto', paddingTop: 10, flexWrap: 'nowrap' }}>
          <Link to={`/proyecto/${project.id}`} className="btn btn-outline btn-sm grow">
            Ver proyecto
          </Link>
          <Link
            to={`/cotizar/${project.id}`}
            className={`btn btn-accent btn-sm grow${stats.cotizables === 0 ? ' btn-disabled' : ''}`}
            aria-disabled={stats.cotizables === 0}
            onClick={(e) => {
              if (stats.cotizables === 0) e.preventDefault();
            }}
            style={stats.cotizables === 0 ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
          >
            COTIZAR
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function CatalogPage() {
  const { projects, units } = useStore();
  const [filter, setFilter] = useState<UnitFilter>(emptyFilter());

  const publicados = useMemo(() => projects.filter((p) => p.publicado), [projects]);
  const options = useMemo(() => buildFilterOptions(units, publicados), [units, publicados]);

  /*
   * El catálogo muestra proyectos, pero los filtros son de unidad. Un proyecto
   * aparece si alguna de sus unidades pasa el filtro. Si el proyecto todavía no
   * tiene stock cargado, aparece igual mientras no haya filtros de unidad activos.
   */
  const resultados = useMemo(() => {
    const byId = new Map(publicados.map((p) => [p.id, p]));
    return publicados
      .map((p) => {
        const propias = units.filter((u) => u.projectId === p.id);
        const coincidentes = propias.filter((u) => matchesUnit(u, filter, byId.get(u.projectId)));
        return { project: p, units: coincidentes, totalUnidades: propias.length };
      })
      .filter(({ project, units: u, totalUnidades }) => {
        if (filter.projectIds.length && !filter.projectIds.includes(project.id)) return false;
        if (filter.comunas.length && !filter.comunas.includes(project.comuna ?? '')) return false;
        if (totalUnidades === 0) {
          // Sin stock: sólo se oculta si hay filtros que dependen de la unidad.
          const texto = filter.texto.trim().toLowerCase();
          const coincideTexto =
            !texto ||
            [project.nombre, project.comuna, project.direccion, project.inmobiliaria].some(
              (c) => c && String(c).toLowerCase().includes(texto),
            );
          return coincideTexto;
        }
        return u.length > 0;
      });
  }, [publicados, units, filter]);

  const totalCotizables = units.filter((u) => u.estado === 'DISPONIBLE').length;

  return (
    <div className="container section stack stack-lg">
      <header className="stack stack-xs">
        <p className="eyebrow">Catálogo</p>
        <h1 className="step-title" style={{ fontSize: 28 }}>
          Proyectos disponibles
        </h1>
        <p className="muted small">
          Seleccione un proyecto para ver su ficha comercial y cotizar una unidad.
        </p>
      </header>

      <FilterPanel filter={filter} onChange={setFilter} options={options} compacto />

      {units.length === 0 && (
        <Note tone="info">
          <span>
            <strong>Stock sin cargar.</strong> Las unidades, precios, descuentos y estados se cargan
            desde la planilla Excel en{' '}
            <Link to="/admin" style={{ textDecoration: 'underline' }}>
              Administrar → Importar stock
            </Link>
            . Mientras tanto no se muestran precios: el sistema no genera valores por su cuenta.
          </span>
        </Note>
      )}

      {resultados.length === 0 ? (
        <Empty titulo="Sin resultados">
          No hay proyectos que cumplan los filtros seleccionados. Pruebe ampliando el rango de
          precio o limpiando los filtros.
        </Empty>
      ) : (
        <>
          <p className="small muted">
            {resultados.length} {resultados.length === 1 ? 'proyecto' : 'proyectos'}
            {totalCotizables > 0 && ` · ${totalCotizables} unidades disponibles en total`}
          </p>
          <div className="grid grid-3">
            {resultados.map(({ project, units: u, totalUnidades }) => (
              <ProjectCard key={project.id} project={project} units={totalUnidades ? u : []} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
