import type { Opcion } from '../compartido/definicion.ts';

interface Props {
  opciones: Opcion[];
  seleccionados: string[];
  alAlternar: (id: string) => void;
  error?: string | undefined;
}

/**
 * Alternativas de selección múltiple. El estado seleccionado usa el azul de La
 * Ruta Inmobiliaria y un área de toque grande, pensada para la tablet del
 * stand.
 */
export function ListaOpciones({ opciones, seleccionados, alAlternar, error }: Props) {
  return (
    <div>
      <div className="opciones" role="group">
        {opciones.map((opcion) => {
          const activa = seleccionados.includes(opcion.id);
          return (
            <button
              key={opcion.id}
              type="button"
              className={`opcion ${activa ? 'opcion--activa' : ''}`}
              aria-pressed={activa}
              onClick={() => alAlternar(opcion.id)}
            >
              <span className="opcion__marca" aria-hidden="true">
                ✓
              </span>
              <span>{opcion.etiqueta}</span>
            </button>
          );
        })}
      </div>
      {error ? <p className="campo__error" style={{ marginTop: 10 }}>{error}</p> : null}
    </div>
  );
}
