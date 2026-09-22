import { MOTIVOS_EXPO, TEMAS_RADIO, etiquetasDe } from '../compartido/definicion.ts';
import type { RespuestaBorrador } from '../compartido/tipos.ts';

interface Props {
  borrador: RespuestaBorrador;
  alAutorizar: (autoriza: boolean) => void;
}

/** Paso 4: autorización de comunicaciones y resumen antes de participar. */
export function PasoCierre({ borrador, alAutorizar }: Props) {
  const { participante } = borrador;
  const temas = etiquetasDe(TEMAS_RADIO, borrador.temasRadio);
  const motivos = etiquetasDe(MOTIVOS_EXPO, borrador.motivosExpo);

  return (
    <div className="tarjeta">
      <div className="tarjeta__encabezado">
        <span className="tarjeta__ojo">Paso 4 de 4</span>
        <h2 className="tarjeta__titulo">Revisa y participa</h2>
        <div className="subrayado-dorado" />
        <p className="tarjeta__bajada">Si está todo bien, toca el botón y quedas participando.</p>
      </div>

      <div className="autorizacion">
        <p className="autorizacion__texto">
          ¿Nos autorizas a enviarte novedades, invitaciones y contenidos de La Ruta Inmobiliaria?
        </p>
        <div className="autorizacion__opciones">
          <button
            type="button"
            className={`chip ${borrador.autorizaComunicaciones ? 'chip--activo' : ''}`}
            aria-pressed={borrador.autorizaComunicaciones}
            onClick={() => alAutorizar(true)}
          >
            Sí, autorizo
          </button>
          <button
            type="button"
            className={`chip ${!borrador.autorizaComunicaciones ? 'chip--activo' : ''}`}
            aria-pressed={!borrador.autorizaComunicaciones}
            onClick={() => alAutorizar(false)}
          >
            No, gracias
          </button>
        </div>
      </div>

      <div className="resumen">
        <div className="resumen__bloque">
          <h3 className="resumen__titulo">Tus datos</h3>
          <p className="resumen__valor">
            {participante.nombre} {participante.apellido}
            <br />
            {participante.telefono} · {participante.email}
            <br />
            {participante.comuna}
          </p>
        </div>

        <div className="resumen__bloque">
          <h3 className="resumen__titulo">🎙️ En la radio quieres escuchar</h3>
          <ul className="resumen__lista">
            {temas.map((tema) => (
              <li key={tema}>{tema}</li>
            ))}
          </ul>
        </div>

        <div className="resumen__bloque">
          <h3 className="resumen__titulo">🏢 Viniste a la Expo porque</h3>
          <ul className="resumen__lista">
            {motivos.map((motivo) => (
              <li key={motivo}>{motivo}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
