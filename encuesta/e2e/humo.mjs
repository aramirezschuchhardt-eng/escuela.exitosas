/**
 * Prueba de humo del servidor: levanta la API con la base de datos en una
 * carpeta temporal y el correo en modo registro, envía una respuesta completa
 * y revisa que quede guardada, que el correo se arme y que el panel responda.
 *
 *   node e2e/humo.mjs
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const carpeta = mkdtempSync(join(tmpdir(), 'encuesta-humo-'));
const PUERTO = 8899;
const BASE = `http://127.0.0.1:${PUERTO}`;

let salida = '';
const servidor = spawn(
  process.execPath,
  ['--experimental-strip-types', '--no-warnings', 'server/index.ts'],
  {
    env: {
      ...process.env,
      ENCUESTA_PUERTO: String(PUERTO),
      ENCUESTA_HOST: '127.0.0.1',
      ENCUESTA_BASE_DATOS: join(carpeta, 'encuesta.sqlite'),
      ENCUESTA_TRANSPORTE_CORREO: 'registro',
      ENCUESTA_CORREO_DESTINO: 'Alison@larutainmobiliaria.cl',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

servidor.stdout.on('data', (trozo) => {
  salida += trozo.toString();
});
servidor.stderr.on('data', (trozo) => {
  salida += trozo.toString();
});

const errores = [];
function revisar(condicion, descripcion) {
  if (condicion) {
    console.log(`  ✓ ${descripcion}`);
  } else {
    errores.push(descripcion);
    console.log(`  ✗ ${descripcion}`);
  }
}

async function esperarServidor() {
  for (let intento = 0; intento < 50; intento += 1) {
    try {
      const respuesta = await fetch(`${BASE}/api/salud`);
      if (respuesta.ok) return await respuesta.json();
    } catch {
      /* todavía no levanta */
    }
    await new Promise((resolver) => setTimeout(resolver, 200));
  }
  throw new Error(`El servidor no respondió:\n${salida}`);
}

const RESPUESTA = {
  participante: {
    nombre: 'Ana',
    apellido: 'Soto',
    telefono: '912345678',
    email: 'ana@correo.cl',
    comuna: 'Ñuñoa',
  },
  temasRadio: ['inversion', 'financiamiento', 'leyes'],
  motivosExpo: ['invertir', 'conocer-proyectos'],
  autorizaComunicaciones: true,
};

function enviar(cuerpo) {
  return fetch(`${BASE}/api/respuestas`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

try {
  const salud = await esperarServidor();
  revisar(salud.ok === true, 'la API responde en /api/salud');
  revisar(salud.integraciones.includes('correo'), 'la integración de correo está activa');

  const creada = await enviar(RESPUESTA);
  revisar(creada.status === 201, 'una respuesta válida se guarda (201)');
  const { id } = await creada.json();
  revisar(typeof id === 'string' && id.length > 10, 'devuelve el identificador de la respuesta');

  const invalida = await enviar({ ...RESPUESTA, participante: { ...RESPUESTA.participante, email: 'no-es-correo' } });
  revisar(invalida.status === 422, 'una respuesta incompleta se rechaza (422)');

  // Espera breve para que la entrega en segundo plano termine.
  await new Promise((resolver) => setTimeout(resolver, 600));

  revisar(salida.includes('Nuevo participante — Encuesta La Ruta Inmobiliaria Expo'), 'el correo usa el asunto pedido');
  revisar(salida.includes('Para: Alison@larutainmobiliaria.cl'), 'el correo va dirigido a Alison@larutainmobiliaria.cl');
  revisar(salida.includes('☑ Oportunidades de inversión'), 'el correo lista las alternativas marcadas');
  revisar(salida.includes('Origen:\nExpo — La Ruta Inmobiliaria'), 'el correo incluye el origen del registro');

  const estadisticas = await (await fetch(`${BASE}/api/admin/estadisticas`)).json();
  revisar(estadisticas.totalRespuestas === 1, 'el panel cuenta una respuesta');
  revisar(estadisticas.correosEnviados === 1, 'el panel marca el correo como enviado');

  const listado = await (await fetch(`${BASE}/api/admin/respuestas`)).json();
  revisar(listado.respuestas[0]?.participante.telefono === '+56 9 1234 5678', 'el teléfono se guarda normalizado');

  const csv = await (await fetch(`${BASE}/api/admin/exportar.csv`)).text();
  revisar(csv.includes('Ana;Soto'), 'la exportación a CSV incluye al participante');

  const negado = await fetch(`${BASE}/api/admin/estadisticas`, { headers: { 'x-reenviado-por': 'prueba' } });
  revisar(negado.status === 200, 'desde localhost el panel abre sin token');
} finally {
  servidor.kill('SIGTERM');
  rmSync(carpeta, { recursive: true, force: true });
}

if (errores.length > 0) {
  console.error(`\n${errores.length} comprobación(es) fallaron`);
  process.exit(1);
}
console.log('\nTodo en orden.');
