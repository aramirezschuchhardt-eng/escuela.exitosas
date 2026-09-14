import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { useStore } from './data/store';
import CatalogPage from './features/catalog/CatalogPage';
import ProjectPage from './features/project/ProjectPage';
import QuoterPage from './features/quoter/QuoterPage';
import QuoteDocPage from './features/quote/QuoteDocPage';

/*
 * El panel administrador arrastra el lector de Excel (SheetJS), que pesa bastante.
 * Se carga bajo demanda para que el catálogo y el cotizador —lo que el broker usa
 * frente al cliente, muchas veces desde el celular— arranquen livianos.
 */
const AdminPage = lazy(() => import('./features/admin/AdminPage'));

/**
 * Marca provisional mientras no se cargue un logo. Se usa un glifo y no las
 * iniciales del nombre porque las iniciales de una empresa cualquiera pueden
 * resultar desafortunadas, y este símbolo sirve para todas.
 */
function MarcaPorDefecto() {
  return (
    <svg viewBox="0 0 32 32" width="18" height="18" aria-hidden focusable="false">
      <path
        d="M6 22V12l10-6 10 6v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M11 22v-6h10v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Topbar() {
  const { settings } = useStore();
  const brand = settings?.brand;
  const nombre = brand?.nombreEmpresa?.trim() || 'Cotizador Inmobiliario';

  return (
    <header className="topbar no-print">
      <div className="container topbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">
            {brand?.logoUrl ? <img src={brand.logoUrl} alt={nombre} /> : <MarcaPorDefecto />}
          </span>
          <span style={{ minWidth: 0 }}>
            <span className="brand-name">{nombre}</span>
            <span className="brand-sub" style={{ display: 'block' }}>
              Cotizador
            </span>
          </span>
        </NavLink>
        <nav className="topnav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Catálogo
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
            Administrar
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

/** Aplica el color de acento configurado por la marca. */
function BrandTheme() {
  const { settings } = useStore();
  useEffect(() => {
    const color = settings?.brand.colorAcento;
    if (color && /^#[0-9a-f]{6}$/i.test(color)) {
      document.documentElement.style.setProperty('--accent', color);
      document.documentElement.style.setProperty('--accent-dark', shade(color, -0.22));
      document.documentElement.style.setProperty('--accent-soft', mix(color, '#ffffff', 0.9));
    }
  }, [settings?.brand.colorAcento]);
  return null;
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function toHex({ r, g, b }: { r: number; g: number; b: number }) {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return toHex({ r: r * (1 + amount), g: g * (1 + amount), b: b * (1 + amount) });
}
function mix(hex: string, con: string, peso: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(con);
  return toHex({
    r: a.r * (1 - peso) + b.r * peso,
    g: a.g * (1 - peso) + b.g * peso,
    b: a.b * (1 - peso) + b.b * peso,
  });
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { cargando } = useStore();

  return (
    <div className="shell">
      <BrandTheme />
      <ScrollToTop />
      <Topbar />
      <main className="grow">
        {cargando ? (
          <div className="container section">
            <p className="muted">Cargando…</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/proyecto/:projectId" element={<ProjectPage />} />
            <Route path="/cotizar/:projectId" element={<QuoterPage />} />
            <Route path="/cotizar/:projectId/:unitId" element={<QuoterPage />} />
            <Route path="/cotizacion/:token" element={<QuoteDocPage />} />
            <Route
              path="/admin"
              element={
                <Suspense
                  fallback={
                    <div className="container section">
                      <p className="muted">Cargando panel…</p>
                    </div>
                  }
                >
                  <AdminPage />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
