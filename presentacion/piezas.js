import { IMG } from './imagenes.js';

/* ═══════════════════════════════════════════════════════════════
   Ayudantes de composición
   ═══════════════════════════════════════════════════════════════ */

const ICONOS = {
  casa:      '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  edificio:  '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/><path d="M10 21v-3h4v3"/>',
  llave:     '<circle cx="8" cy="8" r="4.2"/><path d="M11 11l9 9M17 17l2-2M14.5 14.5l2-2"/>',
  personas:  '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.3a3.2 3.2 0 0 1 0 5.4M17.5 14.8c2.1.7 3.5 2.5 3.5 5.2"/>',
  megafono:  '<path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1Z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  mensaje:   '<path d="M20 12a7.5 7.5 0 0 1-11 6.6L4 20l1.4-4.9A7.5 7.5 0 1 1 20 12Z"/>',
  telefono:  '<path d="M16.5 21c-7.5 0-13.5-6-13.5-13.5 0-1 .3-1.9 1-2.6L5.6 3.6a1.2 1.2 0 0 1 1.8.1l2.2 2.9c.4.5.3 1.2-.1 1.7l-1.1 1.1a11 11 0 0 0 5.2 5.2l1.1-1.1c.5-.4 1.2-.5 1.7-.1l2.9 2.2c.6.4.6 1.3.1 1.8l-1.3 1.6c-.7.7-1.6 1-2.6 1Z"/>',
  calculadora:'<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="6" width="8" height="3.5" rx="1"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 17h.01M12 17h.01M15.5 17h.01"/>',
  documento: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  grafico:   '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7.5" y="12" width="3" height="5" rx="1"/><rect x="13" y="8.5" width="3" height="8.5" rx="1"/><rect x="18" y="5.5" width="3" height="11.5" rx="1"/>',
  reloj:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
  mapa:      '<path d="M20 10.5c0 5.3-8 12-8 12s-8-6.7-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10.3" r="2.8"/>',
  camara:    '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7l1.4-2.4h3.2L15 7"/><circle cx="12" cy="13.5" r="3.4"/>',
  estrella:  '<path d="m12 3.5 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.5l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
  check:     '<path d="m4.5 12.5 5 5 10-11"/>',
  maletin:   '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3 12.5h18"/>',
  escudo:    '<path d="M12 3 5 6v6c0 4.3 3 8.2 7 9 4-.8 7-4.7 7-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  chispa:    '<path d="M12 3v4M12 17v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M3 12h4M17 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>',
  lupa:      '<circle cx="11" cy="11" r="7"/><path d="m16.2 16.2 4.3 4.3"/>',
  corazon:   '<path d="M12 20s-7.5-4.7-7.5-9.8A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.8C19.5 15.3 12 20 12 20Z"/>',
  manos:     '<path d="m3 12 4-4 5 4 3-2.5 6 5"/><path d="M3 12v4.5l6 3.5 6-2 6-3.5V15"/>',
  bandera:   '<path d="M5 21V4"/><path d="M5 5h11l-1.6 3.5L16 12H5"/>',
  regalo:    '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12"/><path d="M12 9S10.5 4.5 8.3 4.5a2.2 2.2 0 0 0 0 4.5Zm0 0s1.5-4.5 3.7-4.5a2.2 2.2 0 0 1 0 4.5Z"/>',
};

export const ico = (n, clase = '') =>
  `<div class="icono ${clase}"><svg viewBox="0 0 24 24">${ICONOS[n] || ICONOS.chispa}</svg></div>`;

const svgPlano = (n) => `<svg viewBox="0 0 24 24">${ICONOS[n] || ICONOS.chispa}</svg>`;

/* Pie de página de cada lámina */
const pie = (etiqueta) => `
  <div class="pie">
    <span class="marca"><b>AVANCE</b> Escuela de Brokers</span>
    <span>${etiqueta}</span>
  </div>`;

/* Fotografía de fondo con su velo */
const fondo = (src, velo = 'abajo', zoom = true) => `
  <div class="foto ${zoom ? 'zoom' : ''}"><img src="${src}" alt=""><div class="velo ${velo}"></div></div>`;

const check = (texto) => `
  <div class="check-fila">
    <span class="check-marca"><svg viewBox="0 0 24 24"><path d="m4.5 12.5 5 5 10-11"/></svg></span>
    <span class="check-texto">${texto}</span>
  </div>`;

const tarjeta = (icono, titulo, texto, clase = '') => `
  <div class="tarjeta ${clase}">
    ${icono ? ico(icono) : ''}
    <div>
      <div class="t-titulo">${titulo}</div>
      <div class="t-texto">${texto}</div>
    </div>
  </div>`;

const tarjetaFoto = (src, rotulo, titulo, texto) => `
  <div class="tarjeta-foto">
    <div class="tf-img"><img src="${src}" alt=""></div>
    <div class="tf-cuerpo">
      <span class="t-num">${rotulo}</span>
      <div class="t-titulo">${titulo}</div>
      <div class="t-texto">${texto}</div>
    </div>
  </div>`;

const celda = (src, pieFoto, area) => `
  <figure class="celda" style="grid-area:${area}"><img src="${src}" alt="">${pieFoto ? `<figcaption>${pieFoto}</figcaption>` : ''}</figure>`;

export { pie, fondo, check, tarjeta, tarjetaFoto, celda, svgPlano };
