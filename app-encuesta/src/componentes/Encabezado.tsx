import { PROGRAMA } from '../compartido/marca.ts';

const BASE = import.meta.env.BASE_URL;

/**
 * Barra superior presente en todas las pantallas: el logotipo de La Ruta
 * Inmobiliaria en su versión blanca y, como marcas asociadas, Agricultura y
 * Agricultura TV, que son las señales donde se emite el programa.
 */
export function Encabezado() {
  return (
    <header className="encabezado">
      <img
        className="encabezado__logo"
        src={`${BASE}marca/la-ruta-inmobiliaria.svg`}
        alt={PROGRAMA.nombre}
      />
      <div className="encabezado__asociadas">
        <span className="encabezado__etiqueta">Programa de</span>
        <div className="encabezado__marcas">
          <img
            className="encabezado__logo-asociada"
            src={`${BASE}marca/agricultura.svg`}
            alt={PROGRAMA.emisora}
          />
          <img
            className="encabezado__logo-asociada"
            src={`${BASE}marca/agricultura-tv.svg`}
            alt={PROGRAMA.emisoraTv}
          />
        </div>
      </div>
    </header>
  );
}
