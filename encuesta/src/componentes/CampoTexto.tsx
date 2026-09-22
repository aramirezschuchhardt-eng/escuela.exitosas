import type { InputHTMLAttributes } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  error?: string | undefined;
  ancho?: boolean;
}

/** Campo de texto de la encuesta: alto táctil, foco visible y error legible. */
export function CampoTexto({ etiqueta, valor, alCambiar, error, ancho = false, id, ...resto }: Props) {
  const identificador = id ?? `campo-${etiqueta.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`campo ${ancho ? 'campo--ancho' : ''}`}>
      <label className="campo__etiqueta" htmlFor={identificador}>
        {etiqueta}
      </label>
      <input
        {...resto}
        id={identificador}
        className={`campo__entrada ${error ? 'campo__entrada--error' : ''}`}
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${identificador}-error` : undefined}
      />
      {error ? (
        <span className="campo__error" id={`${identificador}-error`}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
