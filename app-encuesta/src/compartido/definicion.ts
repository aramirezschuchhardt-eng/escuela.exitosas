/**
 * Definición de la encuesta: preguntas, alternativas y pasos. Es la única
 * fuente de verdad; el formulario, el correo, el panel y las estadísticas leen
 * de aquí. Para agregar o cambiar una alternativa basta con editar este
 * archivo (conservando los `id`, que son los que quedan en la base de datos).
 */

export const ORIGEN_ENCUESTA = 'Expo — La Ruta Inmobiliaria';

export interface Opcion {
  id: string;
  etiqueta: string;
}

/** 🎙️ ¿Qué le gustaría escuchar en la radio? */
export const TEMAS_RADIO: Opcion[] = [
  { id: 'inversion', etiqueta: 'Oportunidades de inversión' },
  { id: 'financiamiento', etiqueta: 'Financiamiento y créditos' },
  { id: 'leyes', etiqueta: 'Leyes y beneficios' },
  { id: 'proyectos-nuevos', etiqueta: 'Proyectos nuevos y preventas' },
  { id: 'arriendo', etiqueta: 'Arriendo y rentabilidad' },
  { id: 'primera-vivienda', etiqueta: 'Consejos para comprar la primera vivienda' },
  { id: 'mercado', etiqueta: 'Tendencias del mercado inmobiliario' },
];

/** 🏢 ¿Por qué vino a la Expo? */
export const MOTIVOS_EXPO: Opcion[] = [
  { id: 'invertir', etiqueta: 'Quiero invertir en propiedades' },
  { id: 'conocer-proyectos', etiqueta: 'Quiero conocer proyectos inmobiliarios' },
  { id: 'primera-vivienda', etiqueta: 'Busco mi primera vivienda' },
  { id: 'cambiar-casa', etiqueta: 'Quiero cambiarme de casa o departamento' },
  { id: 'financiamiento', etiqueta: 'Busco información de financiamiento' },
  { id: 'acompanando', etiqueta: 'Vengo acompañando a alguien' },
  { id: 'sector', etiqueta: 'Trabajo en el sector inmobiliario' },
];

/** Comunas sugeridas (Región Metropolitana y alrededores). El campo acepta
 *  cualquier texto, así que una comuna fuera de la lista también se guarda. */
export const COMUNAS: string[] = [
  'Buin', 'Calera de Tango', 'Cerrillos', 'Cerro Navia', 'Colina', 'Conchalí',
  'Curacaví', 'El Bosque', 'El Monte', 'Estación Central', 'Huechuraba',
  'Independencia', 'Isla de Maipo', 'La Cisterna', 'La Florida', 'La Granja',
  'La Pintana', 'La Reina', 'Lampa', 'Las Condes', 'Lo Barnechea',
  'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'María Pinto', 'Melipilla',
  'Ñuñoa', 'Padre Hurtado', 'Paine', 'Pedro Aguirre Cerda', 'Peñaflor',
  'Peñalolén', 'Pirque', 'Providencia', 'Pudahuel', 'Puente Alto', 'Quilicura',
  'Quinta Normal', 'Recoleta', 'Renca', 'San Bernardo', 'San Joaquín',
  'San José de Maipo', 'San Miguel', 'San Ramón', 'Santiago', 'Talagante',
  'Tiltil', 'Vitacura', 'Otra comuna',
];

/** Pasos de la encuesta, en orden. Alimentan la barra de progreso. */
export const PASOS = [
  { id: 'datos', titulo: 'Tus datos', descripcion: 'Para contactarte si ganas' },
  { id: 'radio', titulo: 'En la radio', descripcion: '¿Qué te gustaría escuchar?' },
  { id: 'expo', titulo: 'Tu visita', descripcion: '¿Por qué viniste a la Expo?' },
  { id: 'cierre', titulo: 'Listo', descripcion: 'Revisa y participa' },
] as const;

export type PasoId = (typeof PASOS)[number]['id'];

/** Devuelve la etiqueta legible de una alternativa; si el id ya no existe en
 *  la definición, se devuelve el id para no perder el dato guardado. */
export function etiquetaDe(opciones: Opcion[], id: string): string {
  return opciones.find((opcion) => opcion.id === id)?.etiqueta ?? id;
}

/** Etiquetas de una lista de ids, en el orden de la definición. */
export function etiquetasDe(opciones: Opcion[], ids: string[]): string[] {
  const seleccionados = new Set(ids);
  const enOrden = opciones.filter((opcion) => seleccionados.has(opcion.id)).map((o) => o.etiqueta);
  const desconocidos = ids.filter((id) => !opciones.some((opcion) => opcion.id === id));
  return [...enOrden, ...desconocidos];
}
