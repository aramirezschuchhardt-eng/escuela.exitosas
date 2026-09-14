import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../../data/store';
import { projectStats } from '../../domain/filters';
import { formatM2, formatUF } from '../../domain/money';
import type { ProjectMediaItem, TipologiaInfo } from '../../domain/types';
import { Badge, Card, Empty, Note, Stat } from '../../components/ui';

const GRUPOS: { key: ProjectMediaItem['grupo']; label: string }[] = [
  { key: 'proyecto', label: 'El proyecto' },
  { key: 'interiores', label: 'Interiores' },
  { key: 'amenities', label: 'Amenities' },
  { key: 'entorno', label: 'Entorno' },
  { key: 'planta', label: 'Plantas' },
];

function ListaOVacio({
  titulo,
  items,
  vacio,
}: {
  titulo: string;
  items: string[];
  vacio: string;
}) {
  return (
    <Card title={titulo}>
      {items.length > 0 ? (
        <ul className="stack stack-xs small">
          {items.map((i) => (
            <li key={i} className="row" style={{ alignItems: 'flex-start', gap: 8, flexWrap: 'nowrap' }}>
              <span style={{ color: 'var(--accent)', lineHeight: 1.5 }}>—</span>
              <span>{i}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Note tone="muted">{vacio}</Note>
      )}
    </Card>
  );
}

function TipologiaCard({ t }: { t: TipologiaInfo }) {
  const sinSuperficies =
    t.superficieUtil == null && t.superficieTerraza == null && t.superficieTotal == null;
  return (
    <div className="card">
      {t.plantaUrl ? (
        <img
          src={t.plantaUrl}
          alt={`Planta ${t.nombre}`}
          style={{ width: '100%', aspectRatio: '4/3', objectFit: 'contain', background: 'var(--canvas)' }}
        />
      ) : (
        <div className="media-empty" style={{ aspectRatio: '4/3' }}>
          Planta pendiente de carga
        </div>
      )}
      <div className="card-body stack stack-sm">
        <h3 style={{ fontSize: 15 }}>{t.nombre}</h3>
        <div className="row" style={{ gap: 6 }}>
          {t.dormitorios != null && (
            <Badge tone="neutral">
              {t.dormitorios === 0 ? 'Estudio' : `${t.dormitorios} dorm.`}
            </Badge>
          )}
          {t.banos != null && <Badge tone="neutral">{t.banos} baño{t.banos === 1 ? '' : 's'}</Badge>}
        </div>
        {sinSuperficies ? (
          <p className="xs dim">{t.nota ?? 'Superficies pendientes de carga.'}</p>
        ) : (
          <dl className="dl">
            <div className="dl-row">
              <dt>Útil</dt>
              <dd>{formatM2(t.superficieUtil)}</dd>
            </div>
            <div className="dl-row">
              <dt>Terraza</dt>
              <dd>{formatM2(t.superficieTerraza)}</dd>
            </div>
            <div className="dl-row">
              <dt>Total</dt>
              <dd>{formatM2(t.superficieTotal)}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const { getProject, unitsOf } = useStore();
  const project = projectId ? getProject(projectId) : undefined;
  const units = useMemo(() => (projectId ? unitsOf(projectId) : []), [projectId, unitsOf]);

  if (!project) {
    return (
      <div className="container section">
        <Empty titulo="Proyecto no encontrado" accion={<Link className="btn btn-primary" to="/">Volver al catálogo</Link>}>
          El proyecto solicitado no existe o fue eliminado.
        </Empty>
      </div>
    );
  }

  const stats = projectStats(units);
  const config = project.config;
  const galeriaPorGrupo = GRUPOS.map((g) => ({
    ...g,
    items: project.galeria.filter((m) => (m.grupo ?? 'proyecto') === g.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="container section stack stack-lg">
      <div>
        <Link to="/" className="btn btn-ghost btn-sm no-print" style={{ marginLeft: -11 }}>
          ← Catálogo
        </Link>
      </div>

      <section className="hero">
        {project.imagenPrincipal && <img src={project.imagenPrincipal} alt="" />}
        <div className="hero-content stack stack-sm">
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,.75)' }}>
            {project.inmobiliaria ?? 'Inmobiliaria por definir'}
          </p>
          <h1>{project.nombre}</h1>
          <p className="small" style={{ color: 'rgba(255,255,255,.85)' }}>
            {[project.direccion, project.comuna].filter(Boolean).join(' · ')}
          </p>
          <div className="row" style={{ marginTop: 6 }}>
            <Link to={`/cotizar/${project.id}`} className="btn btn-accent btn-lg">
              COTIZAR UNA UNIDAD
            </Link>
            {project.brochureUrl && (
              <a
                href={project.brochureUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                Ver brochure
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-4">
        <Stat
          label="Precio desde"
          value={stats.precioDesdeUF != null ? formatUF(stats.precioDesdeUF) : '—'}
          sub={stats.precioHastaUF != null ? `hasta ${formatUF(stats.precioHastaUF)}` : 'sin stock cargado'}
        />
        <Stat
          label="Unidades disponibles"
          value={stats.cotizables}
          sub={stats.total > 0 ? `de ${stats.total} en el stock` : 'stock sin cargar'}
        />
        <Stat
          label="Tipologías"
          value={stats.tipologias.length || project.tipologias.length}
          sub={(stats.tipologias.length ? stats.tipologias : project.tipologias.map((t) => t.nombre))
            .slice(0, 3)
            .join(' · ')}
        />
        <Stat
          label="Financiamiento"
          value={config.financiamiento.map((f) => `${(f * 100).toFixed(0)}%`).join(' / ')}
          sub={config.creditoDirecto.enabled ? 'con crédito directo' : 'sin crédito directo'}
        />
      </div>

      {project.descripcion && (
        <Card title="El proyecto">
          <p className="small" style={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {project.descripcion}
          </p>
        </Card>
      )}

      {galeriaPorGrupo.length > 0 ? (
        galeriaPorGrupo.map((g) => (
          <Card key={g.key} title={g.label}>
            <div className="gallery">
              {g.items.map((m, i) => (
                <figure key={i}>
                  <img src={m.url} alt={m.caption ?? g.label} loading="lazy" />
                  {m.caption && <figcaption>{m.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </Card>
        ))
      ) : (
        <Note tone="muted">
          <span>
            <strong>Galería pendiente de carga.</strong> Las fotografías del proyecto, interiores,
            amenities y plantas se cargan desde <Link to="/admin" style={{ textDecoration: 'underline' }}>Administrar → Proyectos → Imágenes</Link>,
            usando el brochure como fuente.
          </span>
        </Note>
      )}

      <div className="grid grid-2">
        <ListaOVacio
          titulo="Ubicación y entorno"
          items={project.entorno}
          vacio="Información de entorno pendiente de carga desde el brochure."
        />
        <ListaOVacio
          titulo="Conectividad"
          items={project.conectividad}
          vacio="Información de conectividad pendiente de carga desde el brochure."
        />
        <ListaOVacio
          titulo="Características del edificio"
          items={project.caracteristicas}
          vacio="Características pendientes de carga desde el brochure."
        />
        <ListaOVacio
          titulo="Amenities"
          items={project.amenities}
          vacio="Amenities pendientes de carga desde el brochure."
        />
        <ListaOVacio
          titulo="Terminaciones"
          items={project.terminaciones}
          vacio="Terminaciones pendientes de carga desde el brochure."
        />
        <ListaOVacio
          titulo="Beneficios para inversionistas"
          items={project.beneficios}
          vacio="Beneficios pendientes de carga desde el brochure."
        />
      </div>

      <Card
        title="Tipologías y plantas"
        desc="Las superficies comerciales provienen del brochure; las superficies de cada unidad provienen de la planilla de stock."
      >
        {project.tipologias.length === 0 ? (
          <Note tone="muted">Tipologías pendientes de carga.</Note>
        ) : (
          <div className="grid grid-3">
            {project.tipologias.map((t) => (
              <TipologiaCard key={t.nombre} t={t} />
            ))}
          </div>
        )}
      </Card>

      <div className="row-between card card-pad">
        <div>
          <h3 style={{ fontSize: 16 }}>¿Listo para cotizar?</h3>
          <p className="small muted">
            Seleccione una unidad disponible y arme la estructura de financiamiento con el cliente.
          </p>
        </div>
        <Link to={`/cotizar/${project.id}`} className="btn btn-accent btn-lg">
          COTIZAR UNA UNIDAD
        </Link>
      </div>
    </div>
  );
}
