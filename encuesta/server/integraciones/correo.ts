/**
 * Integración obligatoria: cada respuesta de la encuesta se envía por correo a
 * La Ruta Inmobiliaria (`ENCUESTA_CORREO_DESTINO`, por defecto
 * Alison@avanceinmobiliario.cl) inmediatamente después de guardarla.
 */

import { config } from '../config.ts';
import { armarCorreo } from '../correo/plantilla.ts';
import { enviarCorreo } from '../correo/transporte.ts';
import type { Integracion } from './tipos.ts';

export const integracionCorreo: Integracion = {
  nombre: 'correo',
  descripcion: `Correo automático a ${config.correo.destino}`,
  obligatoria: true,
  activa: () => config.correo.destino.length > 0,
  entregar: async (respuesta) => {
    const { asunto, texto, html } = armarCorreo(respuesta);
    const resultado = await enviarCorreo({
      para: [config.correo.destino, ...config.correo.copias],
      asunto,
      texto,
      html,
      responderA: config.correo.responderAlParticipante ? respuesta.participante.email : undefined,
    });
    console.info(
      `[correo] respuesta ${respuesta.id} enviada a ${config.correo.destino} vía ${resultado.transporte}` +
        (resultado.referencia ? ` (${resultado.referencia})` : ''),
    );
  },
};
