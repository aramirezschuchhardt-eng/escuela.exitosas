import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../data/store';
import { defaultProjectConfig } from '../../domain/defaults';
import { projectStats } from '../../domain/filters';
import { formatDate, formatUF } from '../../domain/money';
import type { Project } from '../../domain/types';
import {
  Badge,
  Card,
  Empty,
  Field,
  Note,
  Stat,
  Tabs,
  TextInput,
  useToast,
} from '../../components/ui';
import ProjectEditor from './ProjectEditor';
import ConditionsEditor from './ConditionsEditor';
import UnitsEditor from './UnitsEditor';
import ImportWizard from './ImportWizard';
import SettingsEditor from './SettingsEditor';

type Tab = 'proyectos' | 'condiciones' | 'unidades' | 'importar' | 'configuracion';

const SESSION_KEY = 'cotizador-inmobiliario:admin';

/**
 * Puerta de acceso al panel. Es una barrera de conveniencia en el navegador, no
 * un mecanismo de autenticación: la autenticación real llega con el backend.
 */
function Gate({ onOk }: { onOk: () => void }) {
  const { settings } = useStore();
  const [clave, setClave] = useState('');
  const [error, setError] = useState(false);

  return (
    <div className="container container-narrow section">
      <Card title="Panel administrador" desc="Área privada de gestión de proyectos y stock.">
        <form
          className="stack stack-md"
          onSubmit={(e) => {
            e.preventDefault();
            if (clave === (settings?.adminPasscode ?? 'admin')) {
              sessionStorage.setItem(SESSION_KEY, '1');
              onOk();
            } else {
              setError(true);
            }
          }}
        >
          <Field label="Clave de acceso" hint="Clave inicial: admin. Puede cambiarla en Configuración.">
            <TextInput value={clave} onChange={setClave} type="password" />
          </Field>
          {error && <Note tone="danger">Clave incorrecta.</Note>}
          <button className="btn btn-primary" type="submit">
            Entrar
          </button>
        </form>
      </Card>
    </div>
  );
}

function ProjectList({
  onEditar,
  onSeleccionar,
  seleccionado,
}: {
  onEditar: (p: Project) => void;
  onSeleccionar: (p: Project) => void;
  seleccionado: string | null;
}) {
  const { projects, unitsOf, saveProject } = useStore();
  const toast = useToast();

  const crear = async () => {
    const nombre = prompt('Nombre del nuevo proyecto:');
    if (!nombre?.trim()) return;
    const id = nombre
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (projects.some((p) => p.id === id)) {
      toast('Ya existe un proyecto con ese nombre.', 'error');
      return;
    }
    const nuevo: Project = {
      id: id || `proyecto-${Date.now()}`,
      nombre: nombre.trim(),
      inmobiliaria: null,
      comuna: null,
      direccion: null,
      descripcion: null,
      imagenPrincipal: null,
      galeria: [],
      brochureUrl: null,
      entorno: [],
      conectividad: [],
      caracteristicas: [],
      amenities: [],
      terminaciones: [],
      beneficios: [],
      tipologias: [],
      config: defaultProjectConfig(),
      publicado: false,
      updatedAt: new Date().toISOString(),
    };
    await saveProject(nuevo);
    toast('Proyecto creado. Complete su información y condiciones.', 'ok');
    onEditar(nuevo);
  };

  return (
    <Card
      title="Proyectos"
      desc="Cada proyecto tiene su propia información comercial y sus propias condiciones."
      aside={
        <button className="btn btn-primary btn-sm" onClick={crear}>
          Nuevo proyecto
        </button>
      }
    >
      {projects.length === 0 ? (
        <Empty titulo="Sin proyectos">Cree el primer proyecto para empezar.</Empty>
      ) : (
        <div className="stack stack-sm">
          {projects.map((p) => {
            const stats = projectStats(unitsOf(p.id));
            return (
              <div
                key={p.id}
                className="card card-pad row-between"
                style={
                  p.id === seleccionado
                    ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' }
                    : undefined
                }
              >
                <div className="row" style={{ gap: 12 }}>
                  {p.imagenPrincipal ? (
                    <img
                      src={p.imagenPrincipal}
                      alt=""
                      style={{ width: 60, height: 46, objectFit: 'cover', borderRadius: 7 }}
                    />
                  ) : (
                    <div className="media-empty" style={{ width: 60, height: 46, borderRadius: 7, fontSize: 9 }}>
                      sin foto
                    </div>
                  )}
                  <div>
                    <div className="row" style={{ gap: 7 }}>
                      <strong>{p.nombre}</strong>
                      {!p.publicado && <Badge tone="warn">No publicado</Badge>}
                    </div>
                    <p className="xs dim">
                      {[p.comuna, p.inmobiliaria].filter(Boolean).join(' · ') || 'Sin comuna ni inmobiliaria'}
                      {' · '}
                      {stats.total > 0
                        ? `${stats.total} unidades · desde ${formatUF(stats.precioDesdeUF)}`
                        : 'sin stock'}
                      {' · '}actualizado {formatDate(p.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="row">
                  <Link to={`/proyecto/${p.id}`} className="btn btn-ghost btn-sm">
                    Ver ficha
                  </Link>
                  <button className="btn btn-outline btn-sm" onClick={() => onSeleccionar(p)}>
                    Trabajar en este
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => onEditar(p)}>
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function AdminPage() {
  const { projects, units, settings } = useStore();
  const [autenticado, setAutenticado] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [tab, setTab] = useState<Tab>('proyectos');
  const [editando, setEditando] = useState<Project | null>(null);
  const [activoId, setActivoId] = useState<string | null>(projects[0]?.id ?? null);

  // `activo` ya cae de vuelta al primer proyecto, así que no hace falta un efecto
  // que sincronice `activoId`.
  const activo = useMemo(
    () => projects.find((p) => p.id === activoId) ?? projects[0] ?? null,
    [projects, activoId],
  );

  if (!autenticado) return <Gate onOk={() => setAutenticado(true)} />;

  const pendientes: string[] = [];
  if (!settings?.ufValue) pendientes.push('Registrar el valor de la UF');
  if (!settings?.brand.nombreEmpresa) pendientes.push('Configurar el nombre de la empresa');
  if (units.length === 0) pendientes.push('Importar el stock desde la planilla Excel');
  if (activo && !activo.imagenPrincipal) pendientes.push(`Cargar la imagen principal de ${activo.nombre}`);

  return (
    <div className="container section stack stack-md">
      <header className="row-between">
        <div>
          <p className="eyebrow">Panel administrador</p>
          <h1 className="step-title">Gestión</h1>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            sessionStorage.removeItem(SESSION_KEY);
            setAutenticado(false);
          }}
        >
          Salir
        </button>
      </header>

      <div className="grid grid-4">
        <Stat label="Proyectos" value={projects.length} />
        <Stat label="Unidades en stock" value={units.length} />
        <Stat label="Disponibles" value={units.filter((u) => u.estado === 'DISPONIBLE').length} />
        <Stat
          label="Valor UF"
          value={settings?.ufValue ? settings.ufValue.toLocaleString('es-CL') : '—'}
          sub={settings?.ufActualizadaEl ? `al ${formatDate(settings.ufActualizadaEl)}` : 'sin configurar'}
        />
      </div>

      {pendientes.length > 0 && (
        <Note tone="info">
          <span>
            <strong>Pendientes de configuración:</strong> {pendientes.join(' · ')}.
          </span>
        </Note>
      )}

      {editando ? (
        <>
          <div className="row-between">
            <h2 className="card-title">Editando: {editando.nombre}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditando(null)}>
              ← Volver al panel
            </button>
          </div>
          <ProjectEditor project={editando} onClose={() => setEditando(null)} />
        </>
      ) : (
        <>
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'proyectos', label: 'Proyectos' },
              { value: 'condiciones', label: 'Condiciones comerciales' },
              { value: 'unidades', label: 'Unidades' },
              { value: 'importar', label: 'Importar stock' },
              { value: 'configuracion', label: 'Configuración' },
            ]}
          />

          {tab !== 'proyectos' && tab !== 'configuracion' && projects.length > 1 && activo && (
            <div className="row">
              <span className="small muted">Proyecto:</span>
              {projects.map((p) => (
                <button
                  key={p.id}
                  className="segmented-item"
                  style={{ flex: 'none', padding: '6px 11px', fontSize: 12.5 }}
                  aria-pressed={p.id === activo.id}
                  onClick={() => setActivoId(p.id)}
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          )}

          {tab === 'proyectos' && (
            <ProjectList
              onEditar={setEditando}
              onSeleccionar={(p) => {
                setActivoId(p.id);
                setTab('condiciones');
              }}
              seleccionado={activo?.id ?? null}
            />
          )}
          {tab === 'condiciones' &&
            (activo ? (
              <ConditionsEditor key={activo.id} project={activo} />
            ) : (
              <Empty titulo="Cree un proyecto primero" />
            ))}
          {tab === 'unidades' &&
            (activo ? (
              <UnitsEditor key={activo.id} project={activo} />
            ) : (
              <Empty titulo="Cree un proyecto primero" />
            ))}
          {tab === 'importar' &&
            (projects.length > 0 ? (
              <ImportWizard projects={projects} />
            ) : (
              <Empty titulo="Cree un proyecto primero" />
            ))}
          {tab === 'configuracion' && <SettingsEditor />}
        </>
      )}
    </div>
  );
}
