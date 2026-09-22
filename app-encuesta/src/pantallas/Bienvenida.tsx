import { PROGRAMA } from '../compartido/marca.ts';

interface Props {
  alComenzar: () => void;
}

/** Pantalla de bienvenida del stand: invita a responder en menos de un minuto. */
export function Bienvenida({ alComenzar }: Props) {
  return (
    <section className="bienvenida">
      <span className="bienvenida__ojo">Expo · {PROGRAMA.nombre}</span>
      <h1 className="bienvenida__titulo">Cuéntanos qué quieres escuchar</h1>
      <p className="bienvenida__bajada">
        Responde tres preguntas rápidas, ayúdanos a preparar los próximos programas y participa en el
        sorteo de la Expo.
      </p>

      <ul className="bienvenida__datos">
        <li className="bienvenida__dato">⏱️ Menos de un minuto</li>
        <li className="bienvenida__dato">🎙️ {PROGRAMA.emisora} · {PROGRAMA.horario}</li>
        <li className="bienvenida__dato">🎁 Participa en el sorteo</li>
      </ul>

      <button type="button" className="boton boton--destacado" onClick={alComenzar}>
        COMENZAR ENCUESTA
      </button>

      <p className="bienvenida__nota">
        Usamos tus datos solo para contactarte por esta actividad y, si lo autorizas, para enviarte
        novedades de {PROGRAMA.nombre}.
      </p>
    </section>
  );
}
