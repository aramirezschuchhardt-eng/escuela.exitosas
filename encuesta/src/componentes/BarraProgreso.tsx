import { PASOS } from '../compartido/definicion.ts';

interface Props {
  /** Índice del paso actual dentro de PASOS. */
  pasoActual: number;
}

/** Barra de progreso de la encuesta, en los colores de La Ruta Inmobiliaria. */
export function BarraProgreso({ pasoActual }: Props) {
  const avance = ((pasoActual + 1) / PASOS.length) * 100;

  return (
    <div className="progreso">
      <div
        className="progreso__pista"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={PASOS.length}
        aria-valuenow={pasoActual + 1}
        aria-label={`Paso ${pasoActual + 1} de ${PASOS.length}`}
      >
        <div className="progreso__avance" style={{ width: `${avance}%` }} />
      </div>
      <ol className="progreso__pasos">
        {PASOS.map((paso, indice) => {
          const estado =
            indice === pasoActual ? 'progreso__paso--activo' : indice < pasoActual ? 'progreso__paso--completado' : '';
          return (
            <li key={paso.id} className={`progreso__paso ${estado}`}>
              {paso.titulo}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
