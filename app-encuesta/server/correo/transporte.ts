/**
 * Transporte de correo. Se elige por variables de entorno y nunca expone
 * credenciales al navegador:
 *
 *   • `resend`   → servicio transaccional por HTTPS (RESEND_API_KEY).
 *   • `smtp`     → cualquier servidor SMTP (SMTP_HOST/USER/PASS…).
 *   • `registro` → sin credenciales: el correo se escribe en el log. Es el modo
 *                  de desarrollo y el que evita que la encuesta se caiga si el
 *                  servicio todavía no está configurado.
 *
 * Agregar otro proveedor es escribir una función más en este archivo.
 */

import { config } from '../config.ts';

export interface MensajeCorreo {
  para: string[];
  asunto: string;
  texto: string;
  html: string;
  responderA?: string;
}

export interface ResultadoEnvio {
  transporte: string;
  /** Identificador que devuelve el proveedor, si lo hay. */
  referencia?: string;
}

async function enviarConResend(mensaje: MensajeCorreo): Promise<ResultadoEnvio> {
  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.correo.resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: config.correo.remitente,
      to: mensaje.para,
      subject: mensaje.asunto,
      text: mensaje.texto,
      html: mensaje.html,
      ...(mensaje.responderA ? { reply_to: mensaje.responderA } : {}),
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    throw new Error(`Resend respondió ${respuesta.status}: ${detalle.slice(0, 300)}`);
  }

  const cuerpo = (await respuesta.json().catch(() => ({}))) as { id?: string };
  return { transporte: 'resend', referencia: cuerpo.id };
}

async function enviarConSmtp(mensaje: MensajeCorreo): Promise<ResultadoEnvio> {
  const { createTransport } = await import('nodemailer');
  const transporte = createTransport({
    host: config.correo.smtp.host,
    port: config.correo.smtp.puerto,
    secure: config.correo.smtp.seguro,
    auth: config.correo.smtp.usuario
      ? { user: config.correo.smtp.usuario, pass: config.correo.smtp.clave }
      : undefined,
  });

  const enviado = await transporte.sendMail({
    from: config.correo.remitente,
    to: mensaje.para,
    subject: mensaje.asunto,
    text: mensaje.texto,
    html: mensaje.html,
    replyTo: mensaje.responderA,
  });

  return { transporte: 'smtp', referencia: enviado.messageId };
}

function enviarAlRegistro(mensaje: MensajeCorreo): ResultadoEnvio {
  console.info(
    [
      '',
      '───── CORREO DE LA ENCUESTA (modo registro, no se envió) ─────',
      `Para: ${mensaje.para.join(', ')}`,
      `Asunto: ${mensaje.asunto}`,
      '',
      mensaje.texto,
      '──────────────────────────────────────────────────────────────',
      '',
    ].join('\n'),
  );
  return { transporte: 'registro' };
}

export async function enviarCorreo(mensaje: MensajeCorreo): Promise<ResultadoEnvio> {
  switch (config.correo.transporte) {
    case 'resend':
      return enviarConResend(mensaje);
    case 'smtp':
      return enviarConSmtp(mensaje);
    case 'registro':
      return enviarAlRegistro(mensaje);
  }
}
