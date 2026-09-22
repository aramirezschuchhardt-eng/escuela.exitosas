import { describe, expect, it } from 'vitest';

import { respuestasACsv } from './exportar.ts';
import type { Respuesta } from '../src/compartido/tipos.ts';

const RESPUESTA: Respuesta = {
  id: 'abc',
  creadaEn: '2026-09-22T19:05:00.000Z',
  origen: 'Expo — La Ruta Inmobiliaria',
  participante: {
    nombre: 'Ana',
    apellido: 'Soto; Pérez',
    telefono: '+56 9 1234 5678',
    email: 'ana@correo.cl',
    comuna: 'Ñuñoa',
  },
  temasRadio: ['inversion', 'leyes'],
  motivosExpo: ['invertir'],
  autorizaComunicaciones: false,
};

describe('exportación a CSV', () => {
  it('parte con el BOM que Excel necesita y la fila de títulos', () => {
    const csv = respuestasACsv([RESPUESTA]);
    expect(csv.startsWith('﻿Fecha;Hora;Nombre;Apellido')).toBe(true);
  });

  it('entrecomilla las celdas que contienen el separador', () => {
    const csv = respuestasACsv([RESPUESTA]);
    expect(csv).toContain('"Soto; Pérez"');
    expect(csv).toContain('Oportunidades de inversión | Leyes y beneficios');
    expect(csv.trimEnd().endsWith('No;Expo — La Ruta Inmobiliaria;abc')).toBe(true);
  });
});
