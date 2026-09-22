import { describe, expect, it } from 'vitest';

import { ASUNTO_CORREO, htmlDelCorreo, textoDelCorreo } from './plantilla.ts';
import type { Respuesta } from '../../src/compartido/tipos.ts';

const RESPUESTA: Respuesta = {
  id: 'b0a1c2d3',
  // 22 de septiembre de 2026, 16:05 en Santiago (UTC-3 en horario de verano).
  creadaEn: '2026-09-22T19:05:00.000Z',
  origen: 'Expo — La Ruta Inmobiliaria',
  participante: {
    nombre: 'Ana',
    apellido: 'Soto',
    telefono: '+56 9 1234 5678',
    email: 'ana@correo.cl',
    comuna: 'Ñuñoa',
  },
  temasRadio: ['inversion', 'financiamiento', 'leyes'],
  motivosExpo: ['invertir', 'conocer-proyectos'],
  autorizaComunicaciones: true,
};

describe('correo de la encuesta', () => {
  it('usa el asunto pedido por La Ruta Inmobiliaria', () => {
    expect(ASUNTO_CORREO).toBe('Nuevo participante — Encuesta La Ruta Inmobiliaria Expo');
  });

  it('ordena la información en las cuatro secciones', () => {
    const texto = textoDelCorreo(RESPUESTA);
    const posiciones = [
      texto.indexOf('👤 DATOS DEL PARTICIPANTE'),
      texto.indexOf('🎙️ ¿QUÉ LE GUSTARÍA ESCUCHAR EN LA RADIO?'),
      texto.indexOf('🏢 ¿POR QUÉ VINO A LA EXPO?'),
      texto.indexOf('📅 DATOS DEL REGISTRO'),
    ];

    expect(posiciones.every((posicion) => posicion >= 0)).toBe(true);
    expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
  });

  it('muestra cada alternativa marcada con su etiqueta completa', () => {
    const texto = textoDelCorreo(RESPUESTA);
    expect(texto).toContain('☑ Oportunidades de inversión');
    expect(texto).toContain('☑ Financiamiento y créditos');
    expect(texto).toContain('☑ Leyes y beneficios');
    expect(texto).toContain('☑ Quiero invertir en propiedades');
    expect(texto).toContain('☑ Quiero conocer proyectos inmobiliarios');
  });

  it('incluye los datos del registro en hora de Chile', () => {
    const texto = textoDelCorreo(RESPUESTA);
    expect(texto).toContain('Nombre:\nAna');
    expect(texto).toContain('Apellido:\nSoto');
    expect(texto).toContain('Teléfono:\n+56 9 1234 5678');
    expect(texto).toContain('Correo:\nana@correo.cl');
    expect(texto).toContain('Comuna:\nÑuñoa');
    expect(texto).toContain('Fecha:\n22 de septiembre de 2026');
    expect(texto).toContain('Hora:\n16:05 h');
    expect(texto).toContain('Origen:\nExpo — La Ruta Inmobiliaria');
    expect(texto).toContain('Autorización de comunicaciones:\nSí');
  });

  it('marca «No» cuando no autoriza comunicaciones', () => {
    const texto = textoDelCorreo({ ...RESPUESTA, autorizaComunicaciones: false });
    expect(texto).toContain('Autorización de comunicaciones:\nNo');
  });

  it('avisa cuando una pregunta quedó sin marcar', () => {
    const texto = textoDelCorreo({ ...RESPUESTA, temasRadio: [] });
    expect(texto).toContain('Sin alternativas marcadas');
  });

  it('escapa el HTML de los datos del participante', () => {
    const html = htmlDelCorreo({
      ...RESPUESTA,
      participante: { ...RESPUESTA.participante, nombre: '<script>alert(1)</script>' },
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
