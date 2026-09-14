import { useState } from 'react';
import { useStore } from '../../data/store';
import { defaultProjectConfig } from '../../domain/defaults';
import { dataUrlSizeKB, fileToDataUrl } from '../../lib/images';
import type { Project, ProjectMediaItem, TipologiaInfo } from '../../domain/types';
import {
  Card,
  Checkbox,
  Field,
  Note,
  NumberInput,
  Select,
  TextInput,
  useToast,
} from '../../components/ui';

/** Editor de una lista de textos (entorno, amenities, terminaciones, etc.). */
function ListaEditor({
  label,
  hint,
  items,
  onChange,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [nuevo, setNuevo] = useState('');
  const agregar = () => {
    const t = nuevo.trim();
    if (!t) return;
    onChange([...items, t]);
    setNuevo('');
  };
  return (
    <Field label={label} hint={hint}>
      <div className="stack stack-xs">
        {items.map((item, i) => (
          <div key={`${item}-${i}`} className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
            <div className="grow">
              <TextInput
                value={item}
                onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))}
              />
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label={`Quitar ${item}`}
            >
              ✕
            </button>
          </div>
        ))}
        <div className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
          <div className="grow">
            <TextInput
              value={nuevo}
              onChange={setNuevo}
              placeholder="Agregar…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  agregar();
                }
              }}
            />
          </div>
          <button className="btn btn-outline btn-sm" onClick={agregar}>
            Agregar
          </button>
        </div>
      </div>
    </Field>
  );
}

function ImagenField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const toast = useToast();
  return (
    <Field label={label} hint={hint}>
      <div className="row" style={{ gap: 10 }}>
        {value ? (
          <img
            src={value}
            alt=""
            style={{
              width: 86,
              height: 64,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--line)',
            }}
          />
        ) : (
          <div
            className="media-empty"
            style={{ width: 86, height: 64, borderRadius: 8, fontSize: 10 }}
          >
            sin imagen
          </div>
        )}
        <div className="stack stack-xs grow">
          <input
            type="file"
            accept="image/*"
            className="input"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const url = await fileToDataUrl(f);
                onChange(url);
                const kb = dataUrlSizeKB(url);
                if (kb > 700) toast(`Imagen cargada (${kb} KB). Considere una más liviana.`, 'info');
              } catch (err) {
                toast(err instanceof Error ? err.message : 'Error al cargar la imagen', 'error');
              }
            }}
          />
          {value && (
            <button className="btn btn-ghost btn-sm" onClick={() => onChange(null)}>
              Quitar imagen
            </button>
          )}
        </div>
      </div>
    </Field>
  );
}

function GaleriaEditor({
  galeria,
  onChange,
}: {
  galeria: ProjectMediaItem[];
  onChange: (g: ProjectMediaItem[]) => void;
}) {
  const toast = useToast();
  const grupos: ProjectMediaItem['grupo'][] = [
    'proyecto',
    'interiores',
    'amenities',
    'entorno',
    'planta',
  ];

  return (
    <div className="stack stack-md">
      <Field label="Agregar fotografías" hint="Se redimensionan automáticamente antes de guardarse.">
        <input
          type="file"
          accept="image/*"
          multiple
          className="input"
          onChange={async (e) => {
            const files = [...(e.target.files ?? [])];
            if (files.length === 0) return;
            try {
              const nuevos: ProjectMediaItem[] = [];
              for (const f of files) {
                nuevos.push({ url: await fileToDataUrl(f), grupo: 'proyecto', caption: '' });
              }
              onChange([...galeria, ...nuevos]);
              toast(`${nuevos.length} imagen(es) agregadas`, 'ok');
            } catch (err) {
              toast(err instanceof Error ? err.message : 'Error al cargar', 'error');
            }
            e.target.value = '';
          }}
        />
      </Field>

      {galeria.length === 0 ? (
        <Note tone="muted">
          Sin imágenes cargadas. Use el brochure del proyecto como fuente de las fotografías.
        </Note>
      ) : (
        <div className="grid grid-3">
          {galeria.map((m, i) => (
            <div key={i} className="card">
              <img src={m.url} alt="" style={{ aspectRatio: '4/3', objectFit: 'cover', width: '100%' }} />
              <div className="card-body stack stack-xs">
                <Select
                  value={m.grupo ?? 'proyecto'}
                  onChange={(g) =>
                    onChange(galeria.map((x, j) => (j === i ? { ...x, grupo: g } : x)))
                  }
                  options={grupos.map((g) => ({ value: g!, label: g! }))}
                />
                <TextInput
                  value={m.caption ?? ''}
                  onChange={(v) =>
                    onChange(galeria.map((x, j) => (j === i ? { ...x, caption: v } : x)))
                  }
                  placeholder="Descripción"
                />
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onChange(galeria.filter((_, j) => j !== i))}
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TipologiasEditor({
  tipologias,
  onChange,
}: {
  tipologias: TipologiaInfo[];
  onChange: (t: TipologiaInfo[]) => void;
}) {
  const set = (i: number, patch: Partial<TipologiaInfo>) =>
    onChange(tipologias.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  return (
    <div className="stack stack-md">
      {tipologias.map((t, i) => (
        <div key={i} className="card card-pad stack stack-sm">
          <div className="row-between">
            <TextInput value={t.nombre} onChange={(v) => set(i, { nombre: v })} />
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onChange(tipologias.filter((_, j) => j !== i))}
            >
              Quitar
            </button>
          </div>
          <div className="grid grid-4">
            <Field label="Dormitorios">
              <NumberInput value={t.dormitorios} onChange={(v) => set(i, { dormitorios: v })} />
            </Field>
            <Field label="Baños">
              <NumberInput value={t.banos} onChange={(v) => set(i, { banos: v })} />
            </Field>
            <Field label="Sup. útil (m²)">
              <NumberInput value={t.superficieUtil} onChange={(v) => set(i, { superficieUtil: v })} />
            </Field>
            <Field label="Terraza (m²)">
              <NumberInput
                value={t.superficieTerraza}
                onChange={(v) => set(i, { superficieTerraza: v })}
              />
            </Field>
          </div>
          <div className="grid grid-2">
            <Field label="Sup. total (m²)">
              <NumberInput value={t.superficieTotal} onChange={(v) => set(i, { superficieTotal: v })} />
            </Field>
            <ImagenField
              label="Planta"
              value={t.plantaUrl}
              onChange={(v) => set(i, { plantaUrl: v })}
            />
          </div>
        </div>
      ))}
      <button
        className="btn btn-outline btn-sm"
        onClick={() =>
          onChange([
            ...tipologias,
            {
              nombre: 'Nueva tipología',
              dormitorios: null,
              banos: null,
              superficieUtil: null,
              superficieTerraza: null,
              superficieTotal: null,
              plantaUrl: null,
            },
          ])
        }
      >
        Agregar tipología
      </button>
    </div>
  );
}

export default function ProjectEditor({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const { saveProject, deleteProject } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<Project>(project);

  const set = <K extends keyof Project>(key: K, value: Project[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const guardar = async () => {
    if (!draft.nombre.trim()) {
      toast('El proyecto necesita un nombre.', 'error');
      return;
    }
    try {
      await saveProject(draft);
      toast('Proyecto guardado', 'ok');
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No fue posible guardar', 'error');
    }
  };

  return (
    <div className="stack stack-md">
      <Card title="Identificación">
        <div className="grid grid-2">
          <Field label="Nombre del proyecto">
            <TextInput value={draft.nombre} onChange={(v) => set('nombre', v)} />
          </Field>
          <Field label="Inmobiliaria" hint="Dejar vacío si aún no está confirmada.">
            <TextInput
              value={draft.inmobiliaria ?? ''}
              onChange={(v) => set('inmobiliaria', v || null)}
            />
          </Field>
          <Field label="Comuna">
            <TextInput value={draft.comuna ?? ''} onChange={(v) => set('comuna', v || null)} />
          </Field>
          <Field label="Dirección">
            <TextInput value={draft.direccion ?? ''} onChange={(v) => set('direccion', v || null)} />
          </Field>
        </div>
        <Field label="Descripción comercial">
          <textarea
            className="textarea"
            value={draft.descripcion ?? ''}
            onChange={(e) => set('descripcion', e.target.value || null)}
            placeholder="Texto tomado del brochure del proyecto."
          />
        </Field>
        <Checkbox
          checked={draft.publicado}
          onChange={(v) => set('publicado', v)}
          label="Publicado en el catálogo"
          hint="Desmarque para ocultarlo mientras se termina de cargar la información."
        />
      </Card>

      <Card title="Imágenes y brochure">
        <div className="stack stack-md">
          <ImagenField
            label="Imagen principal"
            hint="Se muestra en el catálogo, la ficha y la cotización."
            value={draft.imagenPrincipal}
            onChange={(v) => set('imagenPrincipal', v)}
          />
          <Field label="URL del brochure (PDF)" hint="Enlace público al brochure del proyecto.">
            <TextInput
              value={draft.brochureUrl ?? ''}
              onChange={(v) => set('brochureUrl', v || null)}
              placeholder="https://…"
            />
          </Field>
          <div className="divider" />
          <GaleriaEditor galeria={draft.galeria} onChange={(g) => set('galeria', g)} />
        </div>
      </Card>

      <Card
        title="Información comercial"
        desc="Contenido tomado del brochure. Lo que no esté en el brochure debe quedar vacío."
      >
        <div className="grid grid-2">
          <ListaEditor
            label="Ubicación y entorno"
            items={draft.entorno}
            onChange={(v) => set('entorno', v)}
          />
          <ListaEditor
            label="Conectividad"
            items={draft.conectividad}
            onChange={(v) => set('conectividad', v)}
          />
          <ListaEditor
            label="Características del edificio"
            items={draft.caracteristicas}
            onChange={(v) => set('caracteristicas', v)}
          />
          <ListaEditor label="Amenities" items={draft.amenities} onChange={(v) => set('amenities', v)} />
          <ListaEditor
            label="Terminaciones"
            items={draft.terminaciones}
            onChange={(v) => set('terminaciones', v)}
          />
          <ListaEditor
            label="Beneficios para inversionistas"
            items={draft.beneficios}
            onChange={(v) => set('beneficios', v)}
          />
        </div>
      </Card>

      <Card title="Tipologías y plantas">
        <TipologiasEditor tipologias={draft.tipologias} onChange={(t) => set('tipologias', t)} />
      </Card>

      <div className="row-between card card-pad">
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (confirm(`¿Eliminar el proyecto "${project.nombre}" y todas sus unidades?`)) {
              void deleteProject(project.id).then(onClose);
            }
          }}
        >
          Eliminar proyecto
        </button>
        <div className="row">
          <button
            className="btn btn-outline"
            onClick={() => set('config', defaultProjectConfig())}
            title="Restablece las condiciones comerciales a los valores por defecto"
          >
            Restablecer condiciones
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={guardar}>
            Guardar proyecto
          </button>
        </div>
      </div>
    </div>
  );
}
