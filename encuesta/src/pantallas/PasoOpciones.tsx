import { ListaOpciones } from '../componentes/ListaOpciones.tsx';
import type { Opcion } from '../compartido/definicion.ts';

interface Props {
  ojo: string;
  titulo: string;
  bajada: string;
  opciones: Opcion[];
  seleccionados: string[];
  alAlternar: (id: string) => void;
  error?: string | undefined;
}

/** Pasos 2 y 3: preguntas de selección múltiple. */
export function PasoOpciones({ ojo, titulo, bajada, opciones, seleccionados, alAlternar, error }: Props) {
  return (
    <div className="tarjeta">
      <div className="tarjeta__encabezado">
        <span className="tarjeta__ojo">{ojo}</span>
        <h2 className="tarjeta__titulo">{titulo}</h2>
        <div className="subrayado-dorado" />
        <p className="tarjeta__bajada">{bajada}</p>
      </div>

      <ListaOpciones
        opciones={opciones}
        seleccionados={seleccionados}
        alAlternar={alAlternar}
        error={error}
      />
    </div>
  );
}
