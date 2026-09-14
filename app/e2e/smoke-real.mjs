/**
 * Prueba end-to-end con los datos reales de Edificio Vista Amunátegui,
 * verificando que la aplicación reproduce exactamente los valores de la planilla.
 */
import { chromium } from 'playwright';
const SP = process.env.SP ?? 'e2e';
const URL = process.env.APP_URL ?? 'http://localhost:4173/';
const errores = [];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
p.on('console', (m) => {
  if (m.type() === 'error' && !/fonts\.googleapis|ERR_CONNECTION_RESET/.test(m.text())) {
    errores.push('console: ' + m.text());
  }
});

const paso = async (n, fn) => {
  process.stdout.write(`▸ ${n} … `);
  try { await fn(); console.log('ok'); }
  catch (e) { console.log('FALLA'); errores.push(`${n}: ${e.message}`); }
};
const debe = (cond, msg) => { if (!cond) throw new Error(msg); };
/** Comparación insensible a mayúsculas: el CSS aplica text-transform en varias etiquetas. */
const contiene = (texto, fragmento) =>
  texto.toLocaleLowerCase('es').includes(fragmento.toLocaleLowerCase('es'));

await paso('Catálogo con el proyecto real', async () => {
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForSelector('.project-card');
  const t = await p.locator('.project-card').first().innerText();
  debe(contiene(t, 'AJ Urbana'), 'falta la inmobiliaria: ' + t);
  debe(t.includes('Amunátegui 767'), 'falta la dirección: ' + t);
  debe(/20 disponibles/i.test(t), 'no muestra 20 disponibles: ' + t);
  // Precio desde = menor precio entre las unidades DISPONIBLES, no del stock completo.
  debe(/UF 3\.042,38/.test(t), 'precio desde incorrecto: ' + t);
  await p.screenshot({ path: SP + '/real-catalogo.png', fullPage: true });
});

await paso('Imágenes del brochure cargan', async () => {
  const rotas = await p.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
  );
  debe(rotas.length === 0, 'imágenes rotas: ' + rotas.join(', '));
});

await paso('Ficha del proyecto con contenido del brochure', async () => {
  await p.click('text=Ver proyecto');
  await p.waitForSelector('text=COTIZAR UNA UNIDAD');
  const txt = await p.locator('main').innerText();
  for (const esperado of [
    'Piscina panorámica en la azotea',
    'Modernos ascensores Heavenward',
    'Cocinas integradas full electric',
    'Metro Cal y Canto',
    'Ficha técnica',
    'Condiciones comerciales',
    'Modelo 7 · 2 Dormitorios + 2 Baños',
  ]) debe(txt.includes(esperado), 'falta en la ficha: ' + esperado);
  const plantas = await p.locator('img[alt^="Planta"]').count();
  debe(plantas === 19, 'se esperaban 19 plantas, hay ' + plantas);
  await p.screenshot({ path: SP + '/real-proyecto.png', fullPage: true });
});

await paso('Stock: 119 unidades, 20 cotizables', async () => {
  await p.click('text=COTIZAR UNA UNIDAD');
  await p.waitForSelector('text=Seleccione una unidad');
  await p.locator('label:has-text("sólo unidades cotizables") input').uncheck();
  await p.waitForTimeout(300);
  const t = await p.locator('text=/de 119 unidades/').innerText();
  debe(/119 de 119 unidades · 20 cotizables/.test(t), 'conteo inesperado: ' + t);
});

await paso('Depto 207 (2D+2B disponible) reproduce la planilla', async () => {
  await p.fill('input[placeholder^="Buscar proyecto"]', '207');
  await p.waitForTimeout(300);
  await p.locator('tr:has-text("207") button:has-text("Seleccionar")').first().click();
  await p.waitForSelector('text=Resumen de tu inversión');
  const precio = await p.locator('.card:has-text("Precio y descuento")').innerText();
  // Planilla: lista 4.067,40 · dcto 10% · con desc 3.660,66 · sin adicionales
  debe(precio.includes('UF 4.067,40'), 'precio lista: ' + precio);
  debe(precio.includes('UF 406,74'), 'descuento: ' + precio);
  debe(precio.includes('UF 3.660,66'), 'precio con descuento: ' + precio);
  const unidad = await p.locator('.card:has-text("Unidad seleccionada")').innerText();
  debe(unidad.includes('56,6 m²') || unidad.includes('56,58'), 'superficie: ' + unidad);
  debe(unidad.includes('Poniente'), 'orientación: ' + unidad);
});

await paso('Crédito directo respeta el mínimo de 5%', async () => {
  const cd = await p
    .locator('section.card')
    .filter({ hasText: 'Porcentaje del precio a financiar directamente' })
    .innerText();
  debe(contiene(cd, '0% interés'), 'falta el 0% interés: ' + cd);
  debe(contiene(cd, 'Del 5% al 10%'), 'no declara el rango documentado: ' + cd);
  const opciones = await p
    .locator('section.card')
    .filter({ hasText: 'Porcentaje del precio a financiar directamente' })
    .locator('button[aria-pressed]')
    .allInnerTexts();
  const pcts = opciones.filter((o) => /%$/.test(o.trim()));
  debe(
    JSON.stringify(pcts) === JSON.stringify(['0%', '5%', '6%', '7%', '8%', '9%', '10%']),
    'porcentajes fuera del rango documentado: ' + JSON.stringify(pcts),
  );
});

await paso('Cotización completa y documento', async () => {
  await p.fill('input[placeholder="Monto manual"]', '420000');
  await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/real-cotizador.png', fullPage: true });
  await p.click('text=GENERAR COTIZACIÓN');
  await p.waitForSelector('.doc');
  const doc = await p.locator('.doc').innerText();
  debe(doc.includes('Edificio Vista Amunátegui'), 'falta el proyecto');
  debe(doc.includes('Simulación referencial'), 'falta el descargo');
  const planta = await p.locator('.doc img[alt="Planta"]').count();
  debe(planta === 1, 'falta la planta en la cotización');
  await p.screenshot({ path: SP + '/real-cotizacion.png', fullPage: true });
});

await paso('Depto 815 (disponible, con estacionamiento) usa el precio negocio final', async () => {
  await p.goto(URL + '#/cotizar/vista-amunategui');
  await p.waitForSelector('text=Seleccione una unidad');
  await p.locator('label:has-text("sólo unidades cotizables") input').uncheck();
  await p.fill('input[placeholder^="Buscar proyecto"]', '815');
  await p.waitForTimeout(300);
  await p.locator('tr:has-text("815") button:has-text("Seleccionar")').first().click();
  await p.waitForSelector('text=Resumen de tu inversión');
  const precio = await p
    .locator('section.card')
    .filter({ hasText: '¿Sobre qué precio se cotiza?' })
    .innerText();
  // Planilla depto 815: con desc 3.685,64 + adicional 350 = negocio final 4.035,64
  debe(precio.includes('UF 3.685,64'), 'precio depto: ' + precio);
  debe(precio.includes('UF 350,00'), 'adicionales: ' + precio);
  debe(precio.includes('UF 4.035,64'), 'negocio final: ' + precio);
  debe(
    contiene(precio, 'Precio a cotizar · Precio negocio final'),
    'no usa la base negocio final: ' + precio,
  );
  const unidad = await p
    .locator('section.card')
    .filter({ hasText: 'Adicionales asignados' })
    .innerText();
  debe(contiene(unidad, 'Estacionamiento 24'), 'no muestra el estacionamiento: ' + unidad);
  // El crédito hipotecario debe calcularse sobre el precio negocio final.
  const fin = await p
    .locator('section.card')
    .filter({ hasText: '¿Cómo quieres financiar esta propiedad?' })
    .innerText();
  debe(fin.includes('UF 3.632,08'), 'el crédito no usa el negocio final (90% de 4.035,64): ' + fin);
});

await paso('Vista móvil 390px sin desborde', async () => {
  const m = await ctx.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(URL);
  await m.waitForSelector('.project-card');
  let o = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  debe(o <= 1, 'desborde en catálogo: ' + o);
  await m.click('.project-card >> text=COTIZAR');
  await m.waitForSelector('text=Seleccione una unidad');
  await m.locator('button:has-text("Seleccionar")').first().click();
  await m.waitForSelector('text=Resumen de tu inversión');
  o = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  debe(o <= 1, 'desborde en cotizador: ' + o);
  await m.screenshot({ path: SP + '/real-movil.png', fullPage: true });
  await m.close();
});

await b.close();
console.log('\n' + (errores.length ? '✗ PROBLEMAS:\n' + errores.join('\n') : '✓ Todo verificado contra la planilla'));
process.exit(errores.length ? 1 : 0);
