/**
 * Validación compartida: el formulario la usa para guiar a la persona y el
 * servidor la vuelve a aplicar antes de guardar, porque nunca se confía en lo
 * que llega desde el navegador.
 */

import { COMUNAS, MOTIVOS_EXPO, TEMAS_RADIO, type Opcion } from './definicion.ts';
import type { Participante, RespuestaBorrador } from './tipos.ts';

/** Largo máximo de cada campo de texto, para no guardar pegados enormes. */
const LARGO_MAXIMO = 120;

export type CampoParticipante = keyof Participante;

export type ErroresEncuesta = Partial<Record<CampoParticipante | 'temasRadio' | 'motivosExpo', string>>;

/** Deja el teléfono en formato +56 9 XXXX XXXX cuando se reconoce un móvil
 *  chileno; en cualquier otro caso devuelve el texto limpio de separadores. */
export function normalizarTelefono(valor: string): string {
  const limpio = valor.replace(/[^\d+]/g, '');
  const soloDigitos = limpio.replace(/\D/g, '');
  const nueveDigitos = soloDigitos.startsWith('56') ? soloDigitos.slice(2) : soloDigitos;
  if (nueveDigitos.length === 9 && nueveDigitos.startsWith('9')) {
    return `+56 ${nueveDigitos[0]} ${nueveDigitos.slice(1, 5)} ${nueveDigitos.slice(5)}`;
  }
  if (nueveDigitos.length === 8) {
    // Móvil escrito sin el 9 inicial, muy habitual al escribir rápido.
    return `+56 9 ${nueveDigitos.slice(0, 4)} ${nueveDigitos.slice(4)}`;
  }
  return limpio;
}

export function telefonoEsValido(valor: string): boolean {
  const soloDigitos = valor.replace(/\D/g, '');
  const sinPais = soloDigitos.startsWith('56') ? soloDigitos.slice(2) : soloDigitos;
  return sinPais.length >= 8 && sinPais.length <= 11;
}

export function emailEsValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(valor.trim());
}

function textoLimpio(valor: unknown): string {
  return typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim().slice(0, LARGO_MAXIMO) : '';
}

function idsValidos(valor: unknown, opciones: Opcion[]): string[] {
  if (!Array.isArray(valor)) return [];
  const permitidos = new Set(opciones.map((opcion) => opcion.id));
  return [...new Set(valor.filter((id): id is string => typeof id === 'string' && permitidos.has(id)))];
}

/** Normaliza cualquier carga (incluso `unknown` recién salida de un JSON) al
 *  borrador que maneja el resto de la aplicación. */
export function normalizarBorrador(carga: unknown): RespuestaBorrador {
  const objeto = (typeof carga === 'object' && carga !== null ? carga : {}) as Record<string, unknown>;
  const participanteCrudo = (
    typeof objeto.participante === 'object' && objeto.participante !== null ? objeto.participante : {}
  ) as Record<string, unknown>;

  const telefono = textoLimpio(participanteCrudo.telefono);

  return {
    participante: {
      nombre: textoLimpio(participanteCrudo.nombre),
      apellido: textoLimpio(participanteCrudo.apellido),
      telefono: telefonoEsValido(telefono) ? normalizarTelefono(telefono) : telefono,
      email: textoLimpio(participanteCrudo.email).toLowerCase(),
      comuna: textoLimpio(participanteCrudo.comuna),
    },
    temasRadio: idsValidos(objeto.temasRadio, TEMAS_RADIO),
    motivosExpo: idsValidos(objeto.motivosExpo, MOTIVOS_EXPO),
    autorizaComunicaciones: objeto.autorizaComunicaciones === true,
  };
}

/** Errores de un borrador completo. Un objeto vacío significa que se puede
 *  guardar y enviar. */
export function validarBorrador(borrador: RespuestaBorrador): ErroresEncuesta {
  const errores: ErroresEncuesta = {};
  const { participante } = borrador;

  if (participante.nombre.length < 2) errores.nombre = 'Escribe tu nombre';
  if (participante.apellido.length < 2) errores.apellido = 'Escribe tu apellido';
  if (!telefonoEsValido(participante.telefono)) errores.telefono = 'Revisa tu teléfono (9 dígitos)';
  if (!emailEsValido(participante.email)) errores.email = 'Revisa tu correo';
  if (participante.comuna.length < 3) errores.comuna = 'Indica tu comuna';
  if (borrador.temasRadio.length === 0) errores.temasRadio = 'Elige al menos una alternativa';
  if (borrador.motivosExpo.length === 0) errores.motivosExpo = 'Elige al menos una alternativa';

  return errores;
}

/** Errores de un solo paso, para no mostrar todo el formulario en rojo. */
export function erroresDelPaso(borrador: RespuestaBorrador, paso: string): ErroresEncuesta {
  const todos = validarBorrador(borrador);
  const porPaso: Record<string, (keyof ErroresEncuesta)[]> = {
    datos: ['nombre', 'apellido', 'telefono', 'email', 'comuna'],
    radio: ['temasRadio'],
    expo: ['motivosExpo'],
    cierre: [],
  };
  const campos = porPaso[paso] ?? [];
  const filtrados: ErroresEncuesta = {};
  for (const campo of campos) {
    const mensaje = todos[campo];
    if (mensaje) filtrados[campo] = mensaje;
  }
  return filtrados;
}

export function borradorVacio(): RespuestaBorrador {
  return {
    participante: { nombre: '', apellido: '', telefono: '', email: '', comuna: '' },
    temasRadio: [],
    motivosExpo: [],
    autorizaComunicaciones: false,
  };
}

/** Sugerencias de comuna para el campo con autocompletado. */
export function sugerenciasComuna(texto: string): string[] {
  const busqueda = texto.trim().toLowerCase();
  if (!busqueda) return COMUNAS.slice(0, 8);
  return COMUNAS.filter((comuna) => comuna.toLowerCase().includes(busqueda)).slice(0, 8);
}
