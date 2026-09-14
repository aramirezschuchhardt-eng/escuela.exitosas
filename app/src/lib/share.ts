import type { QuoteParams } from '../domain/types';

/**
 * Codifica los parámetros de una cotización en la URL, para poder compartirla
 * por link / WhatsApp / correo sin necesidad de backend.
 *
 * Se usa una forma compacta (claves de 2 letras) porque el link viaja por
 * WhatsApp y conviene que sea corto.
 */
interface Compact {
  p: string;
  u: string;
  b: number;
  l: number;
  c: number;
  n: number;
  y: number;
  a: number | null;
  i: number;
}

export function encodeQuote(params: QuoteParams): string {
  const compact: Compact = {
    p: params.projectId,
    u: params.unitId,
    b: round(params.bonoPiePct, 4),
    l: round(params.ltv, 4),
    c: round(params.creditoDirectoPct, 4),
    n: params.creditoDirectoCuotas,
    y: params.plazoAnios,
    a: params.arriendoCLP,
    i: round(params.ivaPct, 4),
  };
  return toBase64Url(JSON.stringify(compact));
}

export function decodeQuote(token: string): QuoteParams | null {
  try {
    const raw = fromBase64Url(token);
    const c = JSON.parse(raw) as Compact;
    if (typeof c.p !== 'string' || typeof c.u !== 'string') return null;
    return {
      projectId: c.p,
      unitId: c.u,
      bonoPiePct: num(c.b, 0),
      ltv: num(c.l, 0.9),
      creditoDirectoPct: num(c.c, 0),
      creditoDirectoCuotas: num(c.n, 60),
      plazoAnios: num(c.y, 30),
      arriendoCLP: typeof c.a === 'number' ? c.a : null,
      ivaPct: num(c.i, 0.1),
    };
  } catch {
    return null;
  }
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function round(value: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function quoteUrl(params: QuoteParams): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/cotizacion/${encodeQuote(params)}`;
}

export function whatsappUrl(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

export function mailtoUrl(asunto: string, cuerpo: string): string {
  return `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}
