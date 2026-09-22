/**
 * Recorre la encuesta completa en un navegador del tamaño de una tablet y deja
 * una captura de cada pantalla, para revisar la identidad visual de un vistazo.
 *
 *   npm run build && node e2e/capturas.mjs
 *
 * Las imágenes quedan en `e2e/capturas/` (carpeta ignorada por git).
 */

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DESTINO = process.env.CAPTURAS_DESTINO ?? join(AQUI, 'capturas');
const PUERTO = Number(process.env.CAPTURAS_PUERTO ?? 8898);
const BASE = `http://127.0.0.1:${PUERTO}`;

mkdirSync(DESTINO, { recursive: true });
const carpetaDatos = mkdtempSync(join(tmpdir(), 'encuesta-capturas-'));

const servidor = spawn(
  process.execPath,
  ['--experimental-strip-types', '--no-warnings', 'server/index.ts'],
  {
    cwd: join(AQUI, '..'),
    env: {
      ...process.env,
      ENCUESTA_PUERTO: String(PUERTO),
      ENCUESTA_HOST: '127.0.0.1',
      ENCUESTA_BASE_DATOS: join(carpetaDatos, 'encuesta.sqlite'),
      ENCUESTA_TRANSPORTE_CORREO: 'registro',
    },
    stdio: 'ignore',
  },
);

async function esperarServidor() {
  for (let intento = 0; intento < 50; intento += 1) {
    try {
      if ((await fetch(`${BASE}/api/salud`)).ok) return;
    } catch {
      /* todavía no levanta */
    }
    await new Promise((resolver) => setTimeout(resolver, 200));
  }
  throw new Error('El servidor no respondió');
}

try {
  await esperarServidor();

  // `CAPTURAS_CHROMIUM` permite apuntar a un Chromium ya instalado en el
  // sistema cuando no coincide con el que descargaría Playwright.
  const navegador = await chromium.launch(
    process.env.CAPTURAS_CHROMIUM ? { executablePath: process.env.CAPTURAS_CHROMIUM } : {},
  );
  const pagina = await navegador.newPage({ viewport: { width: 900, height: 1200 } });

  await pagina.goto(BASE, { waitUntil: 'networkidle' });
  await pagina.screenshot({ path: join(DESTINO, '01-bienvenida.png') });

  await pagina.getByRole('button', { name: 'COMENZAR ENCUESTA' }).click();
  await pagina.getByLabel('Nombre').fill('Ana');
  await pagina.getByLabel('Apellido').fill('Soto');
  await pagina.getByLabel('Teléfono').fill('912345678');
  await pagina.getByLabel('Correo').fill('ana@correo.cl');
  await pagina.getByLabel('Comuna').fill('Ñuñoa');
  await pagina.screenshot({ path: join(DESTINO, '02-datos.png') });

  await pagina.getByRole('button', { name: 'Continuar' }).click();
  await pagina.getByRole('button', { name: 'Oportunidades de inversión' }).click();
  await pagina.getByRole('button', { name: 'Financiamiento y créditos' }).click();
  await pagina.screenshot({ path: join(DESTINO, '03-radio.png') });

  await pagina.getByRole('button', { name: 'Continuar' }).click();
  await pagina.getByRole('button', { name: 'Quiero invertir en propiedades' }).click();
  await pagina.screenshot({ path: join(DESTINO, '04-expo.png') });

  await pagina.getByRole('button', { name: 'Continuar' }).click();
  await pagina.getByRole('button', { name: 'Sí, autorizo' }).click();
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: join(DESTINO, '05-cierre.png'), fullPage: true });

  await pagina.getByRole('button', { name: '¡YA ESTÁS PARTICIPANDO!' }).click();
  await pagina.waitForTimeout(800);
  await pagina.screenshot({ path: join(DESTINO, '06-confirmacion.png') });

  await pagina.goto(`${BASE}/#/admin`, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(1200);
  await pagina.screenshot({ path: join(DESTINO, '07-panel.png'), fullPage: true });

  await navegador.close();
  console.log(`Capturas en ${DESTINO}`);
} finally {
  servidor.kill('SIGTERM');
  rmSync(carpetaDatos, { recursive: true, force: true });
}
