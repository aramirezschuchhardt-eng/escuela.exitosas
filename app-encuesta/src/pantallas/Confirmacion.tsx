import { useEffect, useState } from 'react';

interface Props {
  /** Vuelve a la bienvenida para que responda la siguiente persona. */
  alReiniciar: () => void;
  /** Segundos antes de volver solo a la pantalla de inicio. */
  segundosParaReiniciar?: number;
}

/**
 * Pantalla de confirmación. Nunca muestra errores técnicos: aunque el correo
 * falle, la respuesta ya quedó guardada y el reintento ocurre en segundo plano.
 */
export function Confirmacion({ alReiniciar, segundosParaReiniciar = 20 }: Props) {
  const [restantes, setRestantes] = useState(segundosParaReiniciar);

  useEffect(() => {
    const temporizador = setInterval(() => {
      setRestantes((valor) => valor - 1);
    }, 1000);
    return () => clearInterval(temporizador);
  }, []);

  useEffect(() => {
    if (restantes <= 0) alReiniciar();
  }, [restantes, alReiniciar]);

  return (
    <section className="confirmacion">
      <span className="confirmacion__emoji" role="img" aria-label="Celebración">
        🎉
      </span>
      <h1 className="confirmacion__titulo">¡GRACIAS POR PARTICIPAR!</h1>
      <p className="confirmacion__texto">Tus respuestas fueron registradas correctamente.</p>
      <p className="confirmacion__sello">¡Ya estás participando!</p>

      <button type="button" className="boton boton--claro" onClick={alReiniciar}>
        Responder otra encuesta ({Math.max(restantes, 0)})
      </button>
    </section>
  );
}
