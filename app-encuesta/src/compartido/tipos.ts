/**
 * Tipos compartidos entre el navegador y el servidor. El mismo contrato se usa
 * para pintar la encuesta, para validarla y para guardarla, de modo que un
 * cambio en las preguntas no deja el correo ni el panel desalineados.
 */

/** Datos personales del participante. */
export interface Participante {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  comuna: string;
}

/** Lo que el navegador envía al terminar la encuesta. */
export interface RespuestaBorrador {
  participante: Participante;
  /** Ids de TEMAS_RADIO seleccionados. */
  temasRadio: string[];
  /** Ids de MOTIVOS_EXPO seleccionados. */
  motivosExpo: string[];
  autorizaComunicaciones: boolean;
}

/** Una respuesta ya guardada en la base de datos. */
export interface Respuesta extends RespuestaBorrador {
  id: string;
  /** Marca de tiempo ISO 8601 en UTC. */
  creadaEn: string;
  /** De dónde viene la respuesta: por ahora siempre la Expo. */
  origen: string;
}

/** Estado de una entrega a una integración (correo, y a futuro CRM, hojas…). */
export type EstadoEntrega = 'pendiente' | 'enviada' | 'fallida';

export interface Entrega {
  id: number;
  respuestaId: string;
  /** Nombre de la integración, por ejemplo `correo`. */
  integracion: string;
  estado: EstadoEntrega;
  intentos: number;
  ultimoError: string | null;
  creadaEn: string;
  actualizadaEn: string;
}

/** Fila que consume el panel administrativo. */
export interface RespuestaConEntregas extends Respuesta {
  entregas: Entrega[];
}

/** Conteo de una alternativa, para las estadísticas del panel. */
export interface ConteoOpcion {
  id: string;
  etiqueta: string;
  total: number;
}

export interface Estadisticas {
  totalRespuestas: number;
  respuestasHoy: number;
  autorizanComunicaciones: number;
  temasRadio: ConteoOpcion[];
  motivosExpo: ConteoOpcion[];
  comunas: ConteoOpcion[];
  correosEnviados: number;
  correosPendientes: number;
  correosFallidos: number;
  ultimaRespuestaEn: string | null;
}
