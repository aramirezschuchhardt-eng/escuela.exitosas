/**
 * Prueba end-to-end del flujo completo del cotizador, contra el build de
 * producción servido por `vite preview`.
 *
 *   npm run build && npm run preview &
 *   node e2e/make-fixture.mjs
 *   node e2e/smoke.mjs
 *
 * Las capturas quedan en la carpeta indicada por la variable SP (por defecto e2e/).
 */
import { chromium } from 'playwright';
const SP = process.env.SP ?? 'e2e';
const URL = process.env.APP_URL ?? 'http://localhost:4173/';
const errores = [];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
p.on('console', (m) => { if (m.type() === 'error') errores.push('console: ' + m.text()); });
p.on('pageerror', (e) => errores.push('pageerror: ' + e.message));

const paso = async (n, fn) => {
  process.stdout.write(`▸ ${n} … `);
  try { await fn(); console.log('ok'); }
  catch (e) { console.log('FALLA'); errores.push(`${n}: ${e.message}`); }
};

await paso('Carga inicial', async () => {
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForSelector('text=Proyectos disponibles');
  if (!(await p.locator('text=Edificio Vista Amunátegui').count())) throw new Error('no aparece el proyecto semilla');
  if (!(await p.locator('text=Stock sin cargar').count())) throw new Error('no avisa que el stock está vacío');
});

await paso('Ficha del proyecto', async () => {
  await p.click('text=Ver proyecto');
  await p.waitForSelector('text=COTIZAR UNA UNIDAD');
  await p.waitForSelector('text=Metro Santa Ana');
  await p.waitForSelector('text=pendiente de carga');
});

await paso('Entrar al panel administrador', async () => {
  await p.goto(URL + '#/admin');
  await p.fill('input[type=password]', 'admin');
  await p.click('button:has-text("Entrar")');
  await p.waitForSelector('text=Panel administrador');
});

await paso('Configurar valor de UF y marca', async () => {
  await p.click('button[role=tab]:has-text("Configuración")');
  await p.waitForSelector('text=Valor de la UF');
  await p.fill('input[placeholder="Ej: 39.000"]', '39250');
  const nombre = p.locator('label:has-text("Nombre de la empresa") input');
  await nombre.fill('Exitosas Brokers');
  await p.click('button:has-text("Guardar configuración")');
  await p.waitForSelector('text=Configuración guardada');
});

await paso('Importar planilla Excel', async () => {
  await p.click('button[role=tab]:has-text("Importar stock")');
  await p.setInputFiles('input[type=file]', SP + '/stock-prueba.xlsx');
  await p.waitForSelector('text=Mapeo de columnas', { timeout: 15000 });
  const sel = await p.locator('table.data tbody tr').count();
  if (sel < 10) throw new Error('columnas no detectadas: ' + sel);
  await p.click('button:has-text("Generar vista previa")');
  await p.waitForSelector('text=Vista previa de la actualización');
  const texto = await p.locator('.grid').first().innerText();
  console.log('\n  preview →', texto.replace(/\n+/g, ' | '));
});

await paso('Confirmar importación', async () => {
  await p.click('button:has-text("Confirmar y actualizar stock")');
  await p.waitForSelector('text=Stock actualizado');
});

await paso('Verificar unidades cargadas', async () => {
  await p.click('button[role=tab]:has-text("Unidades")');
  await p.waitForSelector('text=Unidades de Edificio Vista Amunátegui');
  const filas = await p.locator('table.data tbody tr').count();
  if (filas !== 40) throw new Error('se esperaban 40 unidades, hay ' + filas);
});

await paso('Catálogo con precios reales', async () => {
  await p.goto(URL);
  await p.waitForSelector('text=Precio desde');
  const t = await p.locator('.project-card').first().innerText();
  if (!/UF\s?[\d.]/.test(t)) throw new Error('no muestra precio desde: ' + t);
  console.log('\n  tarjeta →', t.replace(/\n+/g, ' | ').slice(0, 200));
});

await paso('Cotizar una unidad', async () => {
  await p.click('.project-card >> text=COTIZAR');
  await p.waitForSelector('text=Seleccione una unidad');
  await p.locator('button:has-text("Seleccionar")').first().click();
  await p.waitForSelector('text=Resumen de tu inversión');
});

await paso('Bono pie 5% y financiamiento 80%', async () => {
  await p.locator('.card:has-text("Bono pie") button[aria-pressed]:has-text("5%")').first().click();
  await p.locator('button:has-text("FINANCIAMIENTO 80%")').click();
  await p.waitForTimeout(200);
});

await paso('Arriendo estimado y flujo', async () => {
  await p.fill('input[placeholder="Monto manual"]', '420000');
  await p.waitForSelector('text=Flujo mensual estimado');
  const flujo = await p.locator('.card:has-text("Flujo mensual estimado")').innerText();
  console.log('\n  flujo →', flujo.replace(/\n+/g, ' | ').slice(0, 320));
});

await paso('Resumen y escenarios', async () => {
  const resumen = await p.locator('.card:has-text("Resumen de tu inversión")').innerText();
  console.log('\n  resumen →', resumen.replace(/\n+/g, ' | ').slice(0, 420));
  await p.waitForSelector('text=Comparación de escenarios');
});

await paso('Generar cotización', async () => {
  await p.click('text=GENERAR COTIZACIÓN');
  await p.waitForSelector('.doc');
  await p.waitForSelector('text=Simulación referencial');
  const doc = await p.locator('.doc').innerText();
  if (!doc.toLowerCase().includes('exitosas brokers')) throw new Error('falta la marca en la cotización');
  await p.screenshot({ path: SP + '/shot-cotizacion.png', fullPage: true });
});

await paso('Link compartible reabre la cotización', async () => {
  const url = p.url();
  const p2 = await ctx.newPage();
  await p2.goto(url);
  await p2.waitForSelector('.doc');
  await p2.close();
});

await paso('Vista móvil 390px', async () => {
  const m = await ctx.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(URL);
  await m.waitForSelector('text=Proyectos disponibles');
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error('scroll horizontal en móvil: ' + overflow + 'px');
  await m.screenshot({ path: SP + '/shot-movil-catalogo.png', fullPage: true });
  await m.click('.project-card >> text=COTIZAR');
  await m.waitForSelector('text=Seleccione una unidad');
  await m.locator('button:has-text("Seleccionar")').first().click();
  await m.waitForSelector('text=Resumen de tu inversión');
  const o2 = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (o2 > 1) throw new Error('scroll horizontal en cotizador móvil: ' + o2 + 'px');
  await m.screenshot({ path: SP + '/shot-movil-cotizador.png', fullPage: true });
  await m.close();
});

await paso('Capturas de escritorio', async () => {
  await p.goto(URL);
  await p.waitForSelector('.project-card');
  await p.screenshot({ path: SP + '/shot-catalogo.png', fullPage: true });
  await p.click('.project-card >> text=COTIZAR');
  await p.waitForSelector('text=Seleccione una unidad');
  await p.locator('button:has-text("Seleccionar")').first().click();
  await p.waitForSelector('text=Resumen de tu inversión');
  await p.fill('input[placeholder="Monto manual"]', '420000');
  await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/shot-cotizador.png', fullPage: true });
});

await b.close();
console.log('\n' + (errores.length ? '✗ PROBLEMAS:\n' + errores.join('\n') : '✓ Todo el flujo pasó sin errores'));
process.exit(errores.length ? 1 : 0);
