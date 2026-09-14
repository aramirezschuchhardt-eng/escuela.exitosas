import { useRef, useState } from 'react';
import { useStore } from '../../data/store';
import { DISCLAIMER_DEFAULT } from '../../domain/defaults';
import { formatCLP, formatDate } from '../../domain/money';
import { dataUrlSizeKB, fileToDataUrl } from '../../lib/images';
import type { AppSettings, Database } from '../../domain/types';
import { Card, Field, Note, NumberInput, TextInput, useToast } from '../../components/ui';

export default function SettingsEditor() {
  const { settings, saveSettings, db, importDatabase, resetAll } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<AppSettings | null>(settings);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!draft || !db) return null;

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const guardar = async () => {
    await saveSettings({
      ...draft,
      ufActualizadaEl:
        draft.ufValue !== settings?.ufValue ? new Date().toISOString() : draft.ufActualizadaEl,
    });
    toast('Configuración guardada', 'ok');
  };

  const exportar = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cotizador-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importar = async (file: File) => {
    try {
      const texto = await file.text();
      const parsed = JSON.parse(texto) as Database;
      if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.units)) {
        throw new Error('El archivo no tiene la estructura esperada.');
      }
      if (
        !confirm(
          `Se reemplazarán todos los datos actuales por los del respaldo (${parsed.projects.length} proyectos, ${parsed.units.length} unidades). ¿Continuar?`,
        )
      )
        return;
      await importDatabase(parsed);
      toast('Respaldo restaurado', 'ok');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No fue posible leer el respaldo.', 'error');
    }
  };

  return (
    <div className="stack stack-md">
      <Card
        title="Valor de la UF"
        desc="Necesario para expresar en pesos los dividendos, cuotas y flujos. Manténgalo actualizado."
      >
        <div className="stack stack-md">
          <div className="grid grid-2">
            <Field label="Valor de la UF en pesos">
              <NumberInput
                value={draft.ufValue || null}
                onChange={(v) => set('ufValue', v ?? 0)}
                suffix="$"
                placeholder="Ej: 39.000"
              />
            </Field>
            <Field label="Última actualización">
              <TextInput value={formatDate(draft.ufActualizadaEl)} onChange={() => {}} readOnly />
            </Field>
          </div>
          {draft.ufValue > 0 ? (
            <Note tone="muted">
              Una propiedad de UF 3.000 equivale a {formatCLP(3000 * draft.ufValue)} con este valor.
            </Note>
          ) : (
            <Note tone="danger">
              Sin valor de UF el cotizador sólo puede mostrar montos en UF. Los dividendos, cuotas,
              arriendo y flujo en pesos quedan sin calcular.
            </Note>
          )}
        </div>
      </Card>

      <Card title="Marca de la empresa" desc="Se usa en la barra superior y en la cotización.">
        <div className="stack stack-md">
          <div className="grid grid-2">
            <Field label="Nombre de la empresa">
              <TextInput
                value={draft.brand.nombreEmpresa}
                onChange={(v) => set('brand', { ...draft.brand, nombreEmpresa: v })}
              />
            </Field>
            <Field label="Color de acento" hint="Formato #RRGGBB.">
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input
                  type="color"
                  value={draft.brand.colorAcento}
                  onChange={(e) => set('brand', { ...draft.brand, colorAcento: e.target.value })}
                  style={{ width: 44, height: 38, padding: 2, border: '1px solid var(--line)', borderRadius: 8 }}
                  aria-label="Color de acento"
                />
                <TextInput
                  value={draft.brand.colorAcento}
                  onChange={(v) => set('brand', { ...draft.brand, colorAcento: v })}
                />
              </div>
            </Field>
          </div>

          <Field label="Logo">
            <div className="row" style={{ gap: 10 }}>
              {draft.brand.logoUrl && (
                <img
                  src={draft.brand.logoUrl}
                  alt=""
                  style={{ height: 44, background: 'var(--canvas)', borderRadius: 8, padding: 4 }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                className="input"
                style={{ maxWidth: 280 }}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const url = await fileToDataUrl(f);
                    set('brand', { ...draft.brand, logoUrl: url });
                    toast(`Logo cargado (${dataUrlSizeKB(url)} KB)`, 'ok');
                  } catch (err) {
                    toast(err instanceof Error ? err.message : 'Error al cargar', 'error');
                  }
                }}
              />
              {draft.brand.logoUrl && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => set('brand', { ...draft.brand, logoUrl: null })}
                >
                  Quitar
                </button>
              )}
            </div>
          </Field>

          <div className="grid grid-3">
            <Field label="Contacto — nombre">
              <TextInput
                value={draft.brand.contactoNombre}
                onChange={(v) => set('brand', { ...draft.brand, contactoNombre: v })}
              />
            </Field>
            <Field label="Contacto — email">
              <TextInput
                value={draft.brand.contactoEmail}
                onChange={(v) => set('brand', { ...draft.brand, contactoEmail: v })}
                type="email"
              />
            </Field>
            <Field label="Contacto — teléfono">
              <TextInput
                value={draft.brand.contactoTelefono}
                onChange={(v) => set('brand', { ...draft.brand, contactoTelefono: v })}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card
        title="Texto legal de las cotizaciones"
        desc="Aparece al final de cada cotización y del cotizador."
      >
        <div className="stack stack-sm">
          <textarea
            className="textarea"
            style={{ minHeight: 110 }}
            value={draft.disclaimer}
            onChange={(e) => set('disclaimer', e.target.value)}
          />
          {draft.disclaimer !== DISCLAIMER_DEFAULT && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => set('disclaimer', DISCLAIMER_DEFAULT)}
            >
              Restaurar texto sugerido
            </button>
          )}
        </div>
      </Card>

      <Card
        title="Acceso al panel"
        desc="Clave para entrar a Administrar desde este navegador."
      >
        <div className="stack stack-sm">
          <Field label="Clave de acceso">
            <TextInput
              value={draft.adminPasscode}
              onChange={(v) => set('adminPasscode', v)}
            />
          </Field>
          <Note tone="warn">
            Esta clave sólo oculta el panel en el navegador: <strong>no es seguridad real</strong>.
            La autenticación de verdad (usuarios, roles, permisos) corresponde a la etapa con
            backend.
          </Note>
        </div>
      </Card>

      <div className="row-between card card-pad">
        <span className="small muted">Los cambios se aplican de inmediato al guardar.</span>
        <button className="btn btn-primary" onClick={guardar}>
          Guardar configuración
        </button>
      </div>

      <Card
        title="Respaldo de datos"
        desc="Los datos viven en este navegador. Exporte un respaldo antes de cambiar de equipo."
      >
        <div className="stack stack-md">
          <div className="row">
            <button className="btn btn-outline" onClick={exportar}>
              Exportar respaldo (.json)
            </button>
            <button className="btn btn-outline" onClick={() => fileRef.current?.click()}>
              Restaurar respaldo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importar(f);
                e.target.value = '';
              }}
            />
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (
                  confirm(
                    '¿Restablecer la aplicación? Se perderán todos los proyectos, unidades y configuraciones de este navegador.',
                  )
                ) {
                  void resetAll().then(() => toast('Aplicación restablecida', 'ok'));
                }
              }}
            >
              Restablecer todo
            </button>
          </div>
          <Note tone="muted">
            {db.projects.length} proyectos · {db.units.length} unidades almacenadas.
          </Note>
        </div>
      </Card>
    </div>
  );
}
