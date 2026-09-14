/** Verifica el módulo de cash flow y plusvalía contra cálculos independientes. */
import { chromium } from 'playwright';
const SP = process.env.SP ?? 'e2e';
const URL = process.env.APP_URL ?? 'http://localhost:4173/';
const errores = [];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
p.on('console', (m) => {
  if (m.type() === 'error' && !/fonts\.googleapis|ERR_CONNECTION_RESET/.test(m.text()))
    errores.push('console: ' + m.text());
});
const paso = async (n, fn) => {
  process.stdout.write(`▸ ${n} … `);
  try { await fn(); console.log('ok'); }
  catch (e) { console.log('FALLA'); errores.push(`${n}: ${e.message}`); }
};
const debe = (c, m) => { if (!c) throw new Error(m); };
const contiene = (t, f) => t.toLocaleLowerCase('es').includes(f.toLocaleLowerCase('es'));
const card = (titulo) => p.locator('section.card').filter({ hasText: titulo });

await paso('Abrir el cotizador con el depto 207', async () => {
  await p.goto(URL + '#/cotizar/vista-amunategui', { waitUntil: 'load' });
  await p.waitForSelector('text=Seleccione una unidad');
  await p.fill('input[placeholder^="Buscar proyecto"]', '207');
  await p.waitForTimeout(300);
  await p.locator('tr:has-text("207") button:has-text("Seleccionar")').first().click();
  await p.waitForSelector('text=Resumen de tu inversión');
  await p.fill('input[placeholder="Monto manual"]', '420000');
  await p.waitForTimeout(400);
});

await paso('El logotipo de Avance Inmobiliario está en la barra', async () => {
  const logo = p.locator('.topbar .brand-logo');
  debe((await logo.count()) === 1, 'no hay logotipo en la barra');
  debe(contiene(await logo.getAttribute('alt'), 'Avance Inmobiliario'), 'alt del logotipo');
  const ok = await logo.evaluate((i) => i.complete && i.naturalWidth > 0);
  debe(ok, 'el logotipo no cargó');
});

await paso('Cash flow mensual descuenta dividendo y crédito directo', async () => {
  const t = await card('Cash flow mensual').innerText();
  debe(contiene(t, 'Arriendo estimado'), 'falta arriendo: ' + t);
  debe(contiene(t, 'Dividendo hipotecario'), 'falta dividendo');
  debe(contiene(t, 'Cuota crédito directo'), 'falta cuota CD');
  debe(contiene(t, 'Primeros 60 meses') && contiene(t, 'Desde el mes 61'), 'faltan las etapas');
});

await paso('Los costos de operación entran en el flujo', async () => {
  const sup = card('Supuestos del cash flow');
  await sup.locator('label:has-text("Gastos comunes") input').fill('80000');
  await sup.locator('label:has-text("Administración") input').fill('10');
  await p.waitForTimeout(400);
  const t = await card('Cash flow mensual').innerText();
  debe(contiene(t, 'Gastos comunes'), 'no aparecen los gastos comunes: ' + t);
  debe(contiene(t, 'Administración'), 'no aparece la administración');
  debe(contiene(t, 'Arriendo neto'), 'no aparece el arriendo neto');
  // Volver a cero para las comprobaciones numéricas siguientes.
  await sup.locator('label:has-text("Gastos comunes") input').fill('0');
  await sup.locator('label:has-text("Administración") input').fill('0');
  await p.waitForTimeout(400);
});

await paso('Proyección a 3, 5 y 10 años con plusvalía 4,5%', async () => {
  const t = await card('Proyección y plusvalía').innerText();
  debe(contiene(t, 'plusvalía anual estimada de 4,5%'), 'plusvalía: ' + t.slice(0, 200));
  for (const a of ['Año 3', 'Año 5', 'Año 10']) debe(contiene(t, a), 'falta ' + a);
  debe(contiene(t, 'Ganancia total'), 'falta la ganancia total');
  debe(contiene(t, 'TIR anual'), 'falta la TIR');
});

await paso('El valor proyectado coincide con el cálculo independiente', async () => {
  const filas = await card('Proyección y plusvalía').locator('table.data tbody tr').allInnerTexts();
  const valor = filas.find((f) => f.startsWith('Valor de la propiedad'));
  // Depto 207: precio con descuento UF 3.660,66, capitalizado al 4,5% anual.
  const esperado = (n) =>
    n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  for (const anio of [3, 5, 10]) {
    const uf = esperado(3660.66 * Math.pow(1.045, anio));
    debe(valor.includes(uf), `año ${anio} esperado UF ${uf}: ${valor}`);
  }
});

await paso('La inversión inicial incluye el fondo de puesta en marcha', async () => {
  const t = await card('Proyección y plusvalía').innerText();
  debe(contiene(t, 'Fondo de puesta en marcha'), 'falta el fondo: ' + t.slice(0, 300));
  debe(contiene(t, 'UF 10,00'), 'el fondo documentado es 10 UF por depto');
});

await paso('La cotización lleva el cash flow', async () => {
  await p.click('text=GENERAR COTIZACIÓN');
  await p.waitForSelector('.doc');
  const t = await p.locator('.doc').innerText();
  debe(contiene(t, 'Arriendo, costos y flujo mensual'), 'falta el cash flow en el documento');
  debe(contiene(t, 'Rentabilidad bruta anual estimada'), 'falta la rentabilidad');
  // El documento no debe repetir el flujo en dos secciones distintas.
  const vecesFlujo = (t.match(/Flujo mensual, primeros/gi) ?? []).length;
  debe(vecesFlujo === 1, `el flujo mensual aparece ${vecesFlujo} veces, debería ser 1`);
  debe(contiene(t, 'Proyección con plusvalía de 4,5% anual'), 'falta la proyección');
  debe(contiene(t, 'Año 10'), 'faltan los horizontes');
  debe(contiene(t, 'no considera impuestos'), 'falta la advertencia de la proyección');
  await p.screenshot({ path: SP + '/cf-cotizacion.png', fullPage: true });
});

await paso('Vista móvil sin desborde', async () => {
  const m = await ctx.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(URL + '#/cotizar/vista-amunategui');
  await m.waitForSelector('text=Seleccione una unidad');
  await m.locator('button:has-text("Seleccionar")').first().click();
  await m.waitForSelector('text=Proyección y plusvalía');
  const o = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  debe(o <= 1, 'desborde horizontal: ' + o);
  await m.screenshot({ path: SP + '/cf-movil.png', fullPage: true });
  await m.close();
});

await paso('Captura del cotizador', async () => {
  await p.goBack();
  await p.waitForSelector('text=Proyección y plusvalía');
  await p.screenshot({ path: SP + '/cf-cotizador.png', fullPage: true });
});

await b.close();
console.log('\n' + (errores.length ? '✗ PROBLEMAS:\n' + errores.join('\n') : '✓ Cash flow verificado'));
process.exit(errores.length ? 1 : 0);
