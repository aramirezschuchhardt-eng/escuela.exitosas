import { LAMINAS } from './guion.js';

const escenario = document.getElementById('escenario');
const barra     = document.getElementById('progreso');
const contador  = document.getElementById('contador');
const mandos    = document.getElementById('mandos');
const panorama  = document.getElementById('panorama');
const ayuda     = document.getElementById('ayuda');
const rejillaPanorama = document.getElementById('panorama-rejilla');

let actual = 0;

/* ── Montaje ── */
LAMINAS.forEach((l, i) => {
  const el = document.createElement('section');
  el.className = 'lamina' + (l.oscura ? ' oscura' : '');
  el.dataset.indice = i;
  el.setAttribute('aria-label', `Lámina ${i + 1}: ${l.titulo}`);
  el.innerHTML = l.html;
  escenario.appendChild(el);

  const mini = document.createElement('button');
  mini.className = 'mini';
  mini.type = 'button';
  mini.innerHTML =
    `<img src="${l.mini}" alt="" loading="lazy">` +
    `<span class="mini-n">${String(i + 1).padStart(2, '0')}</span>` +
    `<span class="mini-txt">${l.titulo}</span>`;
  mini.addEventListener('click', () => { ir(i); cerrarPanorama(); });
  rejillaPanorama.appendChild(mini);
});

/* Red de seguridad: una fotografía que no carga se reemplaza por un
   degradado de marca, en vez de dejar un icono roto en medio de la lámina.
   Cubre también las miniaturas de la vista general. */
function respaldar(img) {
  img.classList.add('sin-foto');
  const caja = img.closest('.foto, .media-foto, .pc-foto, .tf-img, .celda, .mini') || img.parentElement;
  caja?.classList.add('sin-foto-fondo');
}
document.querySelectorAll('#escenario img, #panorama img').forEach(img => {
  img.addEventListener('error', () => respaldar(img), { once: true });
  // Por si ya había fallado antes de que alcanzáramos a escucharla
  if (img.complete && img.naturalWidth === 0) respaldar(img);
});

const laminas = [...escenario.querySelectorAll('.lamina')];
const minis   = [...rejillaPanorama.querySelectorAll('.mini')];

/* ── Escala: la lámina de 1280×720 siempre cabe entera ── */
function escalar() {
  const margen = window.innerWidth < 700 ? 8 : 24;
  const escala = Math.min(
    (window.innerWidth  - margen * 2) / 1280,
    (window.innerHeight - margen * 2) / 720
  );
  document.documentElement.style.setProperty('--escala', escala);
}

/* ── Navegación ── */
function ir(i) {
  actual = Math.max(0, Math.min(LAMINAS.length - 1, i));
  laminas.forEach((el, n) => el.classList.toggle('activa', n === actual));
  minis.forEach((el, n) => el.classList.toggle('actual', n === actual));
  barra.style.width = `${((actual + 1) / LAMINAS.length) * 100}%`;
  contador.textContent = `${String(actual + 1).padStart(2, '0')} / ${LAMINAS.length}`;
  if (location.hash !== `#${actual + 1}`) history.replaceState(null, '', `#${actual + 1}`);
  precargar(actual + 1);
  precargar(actual + 2);
}

const avanzar  = () => ir(actual + 1);
const retroceder = () => ir(actual - 1);

/* Precarga la fotografía de las láminas siguientes */
const yaPrecargado = new Set();
function precargar(i) {
  if (i >= LAMINAS.length || yaPrecargado.has(i)) return;
  yaPrecargado.add(i);
  const temp = document.createElement('div');
  temp.innerHTML = LAMINAS[i].html;
  temp.querySelectorAll('img').forEach(img => { new Image().src = img.getAttribute('src'); });
}

/* ── Vista general ── */
const abrirPanorama  = () => panorama.classList.add('abierto');
const cerrarPanorama = () => panorama.classList.remove('abierto');

/* ── Teclado ── */
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (panorama.classList.contains('abierto') && (k === 'Escape' || k === 'o' || k === 'O')) {
    cerrarPanorama(); e.preventDefault(); return;
  }
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { avanzar(); e.preventDefault(); }
  else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace')        { retroceder(); e.preventDefault(); }
  else if (k === 'Home')  { ir(0); e.preventDefault(); }
  else if (k === 'End')   { ir(LAMINAS.length - 1); e.preventDefault(); }
  else if (k === 'o' || k === 'O') { abrirPanorama(); e.preventDefault(); }
  else if (k === 'f' || k === 'F') {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
    e.preventDefault();
  }
  else if (k === 'p' || k === 'P') { window.print(); e.preventDefault(); }
});

/* ── Clic y gesto ── */
document.querySelector('.zona.adelante').addEventListener('click', avanzar);
document.querySelector('.zona.atras').addEventListener('click', retroceder);
document.getElementById('btn-adelante').addEventListener('click', avanzar);
document.getElementById('btn-atras').addEventListener('click', retroceder);
document.getElementById('btn-panorama').addEventListener('click', abrirPanorama);
document.getElementById('btn-pantalla').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
});
panorama.addEventListener('click', (e) => { if (e.target === panorama) cerrarPanorama(); });

let xInicio = null;
addEventListener('touchstart', (e) => { xInicio = e.changedTouches[0].clientX; }, { passive: true });
addEventListener('touchend', (e) => {
  if (xInicio === null) return;
  const dx = e.changedTouches[0].clientX - xInicio;
  if (Math.abs(dx) > 55) (dx < 0 ? avanzar : retroceder)();
  xInicio = null;
}, { passive: true });

/* Los mandos aparecen al mover el mouse y se esconden solos */
let temporizador;
addEventListener('mousemove', () => {
  mandos.classList.add('visible');
  ayuda.classList.add('visible');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    mandos.classList.remove('visible');
    ayuda.classList.remove('visible');
  }, 2600);
});

/* Enlaces profundos: #7 abre la lámina 7 */
addEventListener('hashchange', () => {
  const n = (parseInt(location.hash.slice(1), 10) || 1) - 1;
  if (n !== actual) ir(n);
});

/* ── Arranque ── */
addEventListener('resize', escalar);
escalar();
ir(Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1));
