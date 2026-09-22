import { PROGRAMA } from '../compartido/marca.ts';

const BASE = import.meta.env.BASE_URL;

/**
 * Barra superior presente en todas las pantallas: la marca principal es La
 * Ruta Inmobiliaria y Radio Agricultura acompaña como marca asociada.
 */
export function Encabezado() {
  return (
    <header className="encabezado">
      <div className="encabezado__ruta">
        <img
          className="encabezado__logo"
          src={`${BASE}marca/la-ruta-inmobiliaria.svg`}
          alt={PROGRAMA.nombre}
        />
      </div>
      <div className="encabezado__asociada">
        <span className="encabezado__etiqueta">Programa de</span>
        <img
          className="encabezado__logo-asociada"
          src={`${BASE}marca/radio-agricultura.svg`}
          alt={PROGRAMA.emisora}
        />
      </div>
    </header>
  );
}
