/**
 * Servidor de la encuesta: API + publicación del build del cliente.
 *
 * Responsabilidades:
 *   • POST /api/respuestas guarda la respuesta y la despacha a las
 *     integraciones (correo a La Ruta Inmobiliaria) en segundo plano.
 *   • /api/admin/* entrega los datos del panel, protegido por token.
 *   • Cualquier otra ruta sirve la aplicación (SPA) desde `dist`.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

import { config, resumenConfig } from './config.ts';
import {
  estadisticas,
  guardarRespuesta,
  listarRespuestas,
  todasLasRespuestas,
  totalRespuestas,
} from './db.ts';
import { barrerPendientes, despachar, iniciarBarridoDeEntregas, integracionesActivas, reintentar } from './integraciones/registro.ts';
import { respuestasACsv } from './exportar.ts';
import { ORIGEN_ENCUESTA } from '../src/compartido/definicion.ts';
import { normalizarBorrador, validarBorrador } from '../src/compartido/validacion.ts';

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function responderJson(res: ServerResponse, codigo: number, cuerpo: unknown): void {
  const texto = JSON.stringify(cuerpo);
  res.writeHead(codigo, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(texto);
}

async function leerCuerpo(req: IncomingMessage, limiteBytes = 64 * 1024): Promise<unknown> {
  const trozos: Buffer[] = [];
  let total = 0;
  for await (const trozo of req) {
    const bloque = trozo as Buffer;
    total += bloque.length;
    if (total > limiteBytes) throw new Error('La solicitud es demasiado grande');
    trozos.push(bloque);
  }
  if (total === 0) return {};
  return JSON.parse(Buffer.concat(trozos).toString('utf8'));
}

/** El panel requiere token; si no hay token configurado, sólo se permite el
 *  acceso desde la propia máquina (el computador del stand). */
function autorizadoComoAdmin(req: IncomingMessage, url: URL): boolean {
  if (config.tokenAdmin) {
    const enviado = (req.headers['x-token-admin'] as string | undefined) ?? url.searchParams.get('token') ?? '';
    return enviado === config.tokenAdmin;
  }
  const origen = req.socket.remoteAddress ?? '';
  return origen === '127.0.0.1' || origen === '::1' || origen === '::ffff:127.0.0.1';
}

function servirEstatico(res: ServerResponse, url: URL): void {
  const raiz = config.rutaEstaticos;
  if (!existsSync(raiz)) {
    responderJson(res, 503, {
      error: 'La aplicación todavía no está compilada. Ejecuta `npm run build`.',
    });
    return;
  }

  const pedido = decodeURIComponent(url.pathname);
  const candidato = resolve(join(raiz, normalize(pedido)));
  const dentroDeRaiz = candidato === raiz || candidato.startsWith(`${raiz}/`);
  const esArchivo = dentroDeRaiz && existsSync(candidato) && statSync(candidato).isFile();
  const archivo = esArchivo ? candidato : join(raiz, 'index.html');

  if (!existsSync(archivo)) {
    responderJson(res, 404, { error: 'No encontrado' });
    return;
  }

  const tipo = TIPOS[extname(archivo).toLowerCase()] ?? 'application/octet-stream';
  const cacheable = esArchivo && archivo.includes('/assets/');
  res.writeHead(200, {
    'content-type': tipo,
    'cache-control': cacheable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(archivo).pipe(res);
}

async function manejarApi(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const ruta = url.pathname;
  const metodo = req.method ?? 'GET';

  if (ruta === '/api/salud') {
    responderJson(res, 200, {
      ok: true,
      respuestas: totalRespuestas(),
      integraciones: integracionesActivas().map((integracion) => integracion.nombre),
      transporteCorreo: config.correo.transporte,
    });
    return;
  }

  if (ruta === '/api/respuestas' && metodo === 'POST') {
    let borrador;
    try {
      borrador = normalizarBorrador(await leerCuerpo(req));
    } catch {
      responderJson(res, 400, { error: 'No pudimos leer la respuesta' });
      return;
    }

    const errores = validarBorrador(borrador);
    if (Object.keys(errores).length > 0) {
      responderJson(res, 422, { error: 'Faltan datos por completar', errores });
      return;
    }

    // 1. Primero se guarda: es el dato que no se puede perder.
    const respuesta = guardarRespuesta(borrador, ORIGEN_ENCUESTA);

    // 2. Se contesta de inmediato para que la pantalla de confirmación aparezca
    //    sin esperar al correo.
    responderJson(res, 201, { id: respuesta.id, creadaEn: respuesta.creadaEn });

    // 3. El correo y el resto de integraciones ocurren en segundo plano; si
    //    fallan, quedan anotadas como pendientes y se reintentan solas.
    void despachar(respuesta).catch((error: unknown) => {
      console.error('[entregas] fallo inesperado al despachar', error);
    });
    return;
  }

  if (ruta.startsWith('/api/admin/')) {
    if (!autorizadoComoAdmin(req, url)) {
      responderJson(res, 401, { error: 'Necesitas el token del panel' });
      return;
    }

    if (ruta === '/api/admin/respuestas' && metodo === 'GET') {
      const limite = Math.min(Number(url.searchParams.get('limite') ?? 200) || 200, 1000);
      const desplazamiento = Math.max(Number(url.searchParams.get('desde') ?? 0) || 0, 0);
      responderJson(res, 200, {
        total: totalRespuestas(),
        respuestas: listarRespuestas(limite, desplazamiento),
      });
      return;
    }

    if (ruta === '/api/admin/estadisticas' && metodo === 'GET') {
      responderJson(res, 200, estadisticas());
      return;
    }

    if (ruta === '/api/admin/exportar.csv' && metodo === 'GET') {
      const csv = respuestasACsv(todasLasRespuestas());
      res.writeHead(200, {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="encuesta-ruta-inmobiliaria.csv"',
        'cache-control': 'no-store',
      });
      res.end(csv);
      return;
    }

    if (ruta === '/api/admin/reenviar' && metodo === 'POST') {
      const cuerpo = (await leerCuerpo(req).catch(() => ({}))) as {
        respuestaId?: string;
        integracion?: string;
      };
      const ok = await reintentar(cuerpo.respuestaId ?? '', cuerpo.integracion ?? 'correo');
      responderJson(res, ok ? 200 : 404, { ok });
      return;
    }

    if (ruta === '/api/admin/reintentar-pendientes' && metodo === 'POST') {
      const reintentadas = await barrerPendientes();
      responderJson(res, 200, { reintentadas });
      return;
    }
  }

  responderJson(res, 404, { error: 'Ruta no encontrada' });
}

const servidor = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  if (url.pathname.startsWith('/api/')) {
    manejarApi(req, res, url).catch((error: unknown) => {
      console.error('[api] error inesperado', error);
      if (!res.headersSent) responderJson(res, 500, { error: 'Error interno' });
      else res.end();
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    responderJson(res, 405, { error: 'Método no permitido' });
    return;
  }

  servirEstatico(res, url);
});

servidor.listen(config.puerto, config.host, () => {
  console.info(`Encuesta La Ruta Inmobiliaria · ${resumenConfig()}`);
  console.info(`Escuchando en http://${config.host}:${config.puerto}`);
  iniciarBarridoDeEntregas();
  void barrerPendientes();
});
