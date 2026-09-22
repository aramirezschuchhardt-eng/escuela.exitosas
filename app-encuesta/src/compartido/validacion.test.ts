import { describe, expect, it } from 'vitest';

import { borradorVacio, normalizarBorrador, normalizarTelefono, validarBorrador } from './validacion.ts';

describe('normalizarTelefono', () => {
  it('deja los móviles chilenos en un formato único', () => {
    expect(normalizarTelefono('912345678')).toBe('+56 9 1234 5678');
    expect(normalizarTelefono('+56 9 1234 5678')).toBe('+56 9 1234 5678');
    expect(normalizarTelefono('56912345678')).toBe('+56 9 1234 5678');
    expect(normalizarTelefono('9 1234 5678')).toBe('+56 9 1234 5678');
  });

  it('completa el 9 inicial cuando se escriben sólo ocho dígitos', () => {
    expect(normalizarTelefono('12345678')).toBe('+56 9 1234 5678');
  });
});

describe('normalizarBorrador', () => {
  it('descarta alternativas que no existen en la definición', () => {
    const borrador = normalizarBorrador({
      participante: { nombre: '  Ana ', apellido: 'Soto', telefono: '912345678', email: 'ANA@Correo.CL', comuna: 'Ñuñoa' },
      temasRadio: ['inversion', 'inventado', 'inversion'],
      motivosExpo: ['invertir'],
      autorizaComunicaciones: 'sí',
    });

    expect(borrador.participante.nombre).toBe('Ana');
    expect(borrador.participante.email).toBe('ana@correo.cl');
    expect(borrador.participante.telefono).toBe('+56 9 1234 5678');
    expect(borrador.temasRadio).toEqual(['inversion']);
    // Sólo el booleano `true` autoriza: cualquier otro valor se toma como «no».
    expect(borrador.autorizaComunicaciones).toBe(false);
  });

  it('tolera una carga vacía o inesperada', () => {
    expect(normalizarBorrador(null)).toEqual(borradorVacio());
    expect(normalizarBorrador({ temasRadio: 'no es lista' }).temasRadio).toEqual([]);
  });
});

describe('validarBorrador', () => {
  it('exige datos de contacto y al menos una alternativa por pregunta', () => {
    const errores = validarBorrador(borradorVacio());
    expect(Object.keys(errores).sort()).toEqual(
      ['apellido', 'comuna', 'email', 'motivosExpo', 'nombre', 'telefono', 'temasRadio'].sort(),
    );
  });

  it('acepta una respuesta completa', () => {
    const borrador = normalizarBorrador({
      participante: {
        nombre: 'Ana',
        apellido: 'Soto',
        telefono: '912345678',
        email: 'ana@correo.cl',
        comuna: 'Ñuñoa',
      },
      temasRadio: ['inversion'],
      motivosExpo: ['invertir'],
      autorizaComunicaciones: true,
    });

    expect(validarBorrador(borrador)).toEqual({});
  });
});
