/** Formateo de montos. Todo el redondeo del sistema ocurre aquí. */

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const uf2 = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num0 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const EMPTY = '—';

export function formatCLP(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return clp.format(Math.round(value));
}

/** Variante con signo explícito, para flujos mensuales. */
export function formatCLPSigned(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  const rounded = Math.round(value);
  const formatted = clp.format(Math.abs(rounded));
  if (rounded > 0) return `+${formatted}`;
  if (rounded < 0) return `−${formatted}`;
  return formatted;
}

export function formatUF(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return `UF ${uf2.format(value)}`;
}

export function formatPct(value: number | null | undefined, decimals = 1): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  const f = decimals === 0 ? num0 : num1;
  return `${f.format(value * 100)}%`;
}

export function formatM2(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return `${num1.format(value)} m²`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return num0.format(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Redondea al múltiplo de `step` más cercano (para el selector de arriendo). */
export function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}
