import { CampoTexto } from '../componentes/CampoTexto.tsx';
import { sugerenciasComuna } from '../compartido/validacion.ts';
import type { ErroresEncuesta } from '../compartido/validacion.ts';
import type { Participante } from '../compartido/tipos.ts';

interface Props {
  participante: Participante;
  alCambiar: (campo: keyof Participante, valor: string) => void;
  errores: ErroresEncuesta;
}

/** Paso 1: datos de contacto del participante. */
export function PasoDatos({ participante, alCambiar, errores }: Props) {
  const sugerencias = sugerenciasComuna(participante.comuna);
  const mostrarSugerencias = participante.comuna.trim().length > 0 && !sugerencias.includes(participante.comuna);

  return (
    <div className="tarjeta">
      <div className="tarjeta__encabezado">
        <span className="tarjeta__ojo">Paso 1 de 4</span>
        <h2 className="tarjeta__titulo">👤 Tus datos</h2>
        <div className="subrayado-dorado" />
        <p className="tarjeta__bajada">Los necesitamos para contactarte si resultas ganador.</p>
      </div>

      <div className="campos">
        <CampoTexto
          etiqueta="Nombre"
          valor={participante.nombre}
          alCambiar={(valor) => alCambiar('nombre', valor)}
          error={errores.nombre}
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder="Tu nombre"
        />
        <CampoTexto
          etiqueta="Apellido"
          valor={participante.apellido}
          alCambiar={(valor) => alCambiar('apellido', valor)}
          error={errores.apellido}
          autoComplete="family-name"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder="Tu apellido"
        />
        <CampoTexto
          etiqueta="Teléfono"
          valor={participante.telefono}
          alCambiar={(valor) => alCambiar('telefono', valor)}
          error={errores.telefono}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="next"
          placeholder="9 1234 5678"
        />
        <CampoTexto
          etiqueta="Correo"
          valor={participante.email}
          alCambiar={(valor) => alCambiar('email', valor)}
          error={errores.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder="nombre@correo.cl"
        />
        <div className="campo--ancho">
          <CampoTexto
            etiqueta="Comuna"
            valor={participante.comuna}
            alCambiar={(valor) => alCambiar('comuna', valor)}
            error={errores.comuna}
            autoComplete="address-level2"
            enterKeyHint="done"
            placeholder="¿En qué comuna vives?"
            list="comunas-sugeridas"
          />
          <datalist id="comunas-sugeridas">
            {sugerencias.map((comuna) => (
              <option key={comuna} value={comuna} />
            ))}
          </datalist>
          {mostrarSugerencias ? (
            <div className="campo__sugerencias">
              {sugerencias.slice(0, 5).map((comuna) => (
                <button
                  key={comuna}
                  type="button"
                  className="chip"
                  onClick={() => alCambiar('comuna', comuna)}
                >
                  {comuna}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
