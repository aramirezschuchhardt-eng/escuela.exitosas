import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { UnitStatus } from '../domain/types';
import { statusLabel } from '../domain/units';
import { EMPTY } from '../domain/money';

/* ── Tarjeta ─────────────────────────────────────────────────────────────── */
export function Card({
  title,
  desc,
  aside,
  children,
  className = '',
}: {
  title?: ReactNode;
  desc?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || aside) && (
        <header className="card-head">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {desc && <p className="card-desc">{desc}</p>}
          </div>
          {aside && <div className="row">{aside}</div>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

/* ── Fila de datos ───────────────────────────────────────────────────────── */
export function Row({
  label,
  value,
  hint,
  total,
  muted,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  total?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`dl-row${total ? ' is-total' : ''}${muted ? ' is-muted' : ''}`}>
      <dt>
        {label}
        {hint && <div className="xs dim">{hint}</div>}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

export function DL({ children }: { children: ReactNode }) {
  return <dl className="dl">{children}</dl>;
}

/* ── Estadística ─────────────────────────────────────────────────────────── */
export function Stat({
  label,
  value,
  sub,
  tone = 'default',
  size = 'md',
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'accent' | 'dark' | 'plain';
  size?: 'md' | 'lg';
}) {
  const cls = tone === 'plain' ? 'stat' : `stat stat-box${tone !== 'default' ? ` ${tone}` : ''}`;
  return (
    <div className={cls}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value${size === 'lg' ? ' lg' : ''}`}>{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

/* ── Badges ──────────────────────────────────────────────────────────────── */
const STATUS_TONE: Record<UnitStatus, string> = {
  DISPONIBLE: 'badge-ok',
  BLOQUEADA: 'badge-warn',
  RESERVADA: 'badge-accent',
  VENDIDA: 'badge-danger',
  DESCONOCIDO: 'badge-neutral',
};

export function StatusBadge({ estado, title }: { estado: UnitStatus; title?: string }) {
  return (
    <span className={`badge ${STATUS_TONE[estado]}`} title={title}>
      <span className="badge-dot" />
      {statusLabel(estado)}
    </span>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'accent' | 'gold';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

/* ── Campos ──────────────────────────────────────────────────────────────── */
export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  suffix,
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  suffix?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const input = (
    <input
      className="input"
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
  if (!suffix) return input;
  return (
    <span className="input-suffix">
      {input}
      <span className="suffix">{suffix}</span>
    </span>
  );
}

/** Input numérico que acepta coma o punto como decimal y admite vacío = null. */
export function NumberInput({
  value,
  onChange,
  suffix,
  placeholder,
  min,
  max,
  step,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [texto, setTexto] = useState(value == null ? '' : String(value));
  const ultimo = useRef(value);

  useEffect(() => {
    if (value !== ultimo.current) {
      ultimo.current = value;
      setTexto(value == null ? '' : String(value));
    }
  }, [value]);

  const commit = (raw: string) => {
    setTexto(raw);
    const limpio = raw.trim().replace(',', '.');
    if (limpio === '') {
      ultimo.current = null;
      onChange(null);
      return;
    }
    const n = Number(limpio);
    if (!Number.isFinite(n)) return;
    let out = n;
    if (min != null) out = Math.max(min, out);
    if (max != null) out = Math.min(max, out);
    ultimo.current = out;
    onChange(out);
  };

  return (
    <TextInput
      value={texto}
      onChange={commit}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      suffix={suffix}
      step={step}
    />
  );
}

export function Select<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      className="select"
      value={String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        const found = options.find((o) => String(o.value) === raw);
        if (found) onChange(found.value);
      }}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; sub?: string }[];
  label?: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className="segmented-item"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.sub && (
            <span className="xs" style={{ display: 'block', opacity: 0.7, fontWeight: 500 }}>
              {o.sub}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  ariaLabel: string;
}) {
  return (
    <input
      className="slider"
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="label">{label}</span>
        {hint && <div className="hint">{hint}</div>}
      </span>
    </label>
  );
}

/* ── Avisos ──────────────────────────────────────────────────────────────── */
export function Note({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'danger' | 'muted';
  children: ReactNode;
}) {
  /*
    `children` va envuelto en un div: `.note` es flex, y si se dejaran sueltos, cada
    tramo de texto y cada <strong> se convertiría en un flex item y el aviso se
    partiría en columnas.
  */
  return (
    <div className={`note note-${tone}`}>
      <div>{children}</div>
    </div>
  );
}

export function Warnings({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="stack stack-xs">
      {items.map((w, i) => (
        <Note key={i} tone="warn">
          {w}
        </Note>
      ))}
    </div>
  );
}

export function Empty({
  titulo,
  children,
  accion,
}: {
  titulo: string;
  children?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="empty">
      <h3>{titulo}</h3>
      {children && <p>{children}</p>}
      {accion && <div style={{ marginTop: 16 }}>{accion}</div>}
    </div>
  );
}

/** Marca visualmente un dato que aún no se ha cargado, en vez de inventarlo. */
export function Pendiente({ que }: { que: string }) {
  return (
    <span className="dim xs" title={`${que}: pendiente de carga`}>
      {EMPTY} <span style={{ fontStyle: 'italic' }}>pendiente de carga</span>
    </span>
  );
}

/* ── Pestañas ────────────────────────────────────────────────────────────── */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: string }[];
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map((i) => (
        <button
          key={i.value}
          role="tab"
          aria-selected={i.value === value}
          className={`tab${i.value === value ? ' is-active' : ''}`}
          onClick={() => onChange(i.value)}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal${wide ? ' modal-wide' : ''}`} role="dialog" aria-modal aria-labelledby={titleId}>
        <header className="card-head" style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 2 }}>
          <h2 className="card-title" id={titleId}>
            {title}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>
        <div className="card-body">{children}</div>
        {footer && (
          <footer
            className="card-head"
            style={{ borderBottom: 'none', borderTop: '1px solid var(--line-2)', justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'var(--surface)' }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

/* ── Toasts ──────────────────────────────────────────────────────────────── */
interface Toast {
  id: number;
  mensaje: string;
  tono: 'ok' | 'error' | 'info';
}
const ToastContext = createContext<(mensaje: string, tono?: Toast['tono']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((mensaje: string, tono: Toast['tono'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, mensaje, tono }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.tono === 'error' ? ' is-error' : t.tono === 'ok' ? ' is-ok' : ''}`}>
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
