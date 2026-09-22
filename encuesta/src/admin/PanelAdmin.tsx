import { useCallback, useEffect, useState } from 'react';

import {
  cargarEstadisticas,
  cargarRespuestas,
  guardarTokenAdmin,
  reenviarCorreo,
  reintentarPendientes,
  tokenAdmin,
  urlExportacion,
} from '../lib/api.ts';
import { MOTIVOS_EXPO, TEMAS_RADIO, etiquetasDe } from '../compartido/definicion.ts';
import { formatearFechaCorta, formatearHora } from '../compartido/fechas.ts';
import type { ConteoOpcion, Estadisticas, RespuestaConEntregas } from '../compartido/tipos.ts';

const REFRESCO_MS = 15_000;

function Metrica({ valor, etiqueta }: { valor: number | string; etiqueta: string }) {
  return (
    <div className="metrica">
      <span className="metrica__valor">{valor}</span>
      <span className="metrica__etiqueta">{etiqueta}</span>
    </div>
  );
}

function Ranking({ titulo, conteos }: { titulo: string; conteos: ConteoOpcion[] }) {
  const maximo = Math.max(1, ...conteos.map((conteo) => conteo.total));

  return (
    <div className="tarjeta">
      <h3 className="tarjeta__ojo">{titulo}</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {conteos.map((conteo) => (
          <div className="barra-dato" key={conteo.id}>
            <span>{conteo.etiqueta}</span>
            <strong>{conteo.total}</strong>
            <div className="barra-dato__pista">
              <div className="barra-dato__avance" style={{ width: `${(conteo.total / maximo) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EstadoCorreo({ respuesta }: { respuesta: RespuestaConEntregas }) {
  const entrega = respuesta.entregas.find((candidata) => candidata.integracion === 'correo');
  const estado = entrega?.estado ?? 'pendiente';
  const texto = estado === 'enviada' ? 'Enviado' : estado === 'fallida' ? 'Falló' : 'Pendiente';

  return (
    <span className={`estado estado--${estado}`} title={entrega?.ultimoError ?? ''}>
      {texto}
    </span>
  );
}

/**
 * Panel administrativo: estadísticas en vivo, listado de participantes, estado
 * del envío de cada correo, reintento manual y exportación a Excel.
 */
export function PanelAdmin() {
  const [token, setToken] = useState(tokenAdmin());
  const [autenticado, setAutenticado] = useState(false);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [respuestas, setRespuestas] = useState<RespuestaConEntregas[]>([]);
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);

  const refrescar = useCallback(async () => {
    try {
      const [datos, listado] = await Promise.all([cargarEstadisticas(), cargarRespuestas()]);
      setEstadisticas(datos);
      setRespuestas(listado.respuestas);
      setAutenticado(true);
      setError('');
    } catch (problema) {
      setAutenticado(false);
      setError(problema instanceof Error ? problema.message : 'No se pudo cargar el panel');
    }
  }, []);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  useEffect(() => {
    if (!autenticado) return;
    const temporizador = setInterval(() => void refrescar(), REFRESCO_MS);
    return () => clearInterval(temporizador);
  }, [autenticado, refrescar]);

  const entrar = (evento: React.FormEvent) => {
    evento.preventDefault();
    guardarTokenAdmin(token.trim());
    void refrescar();
  };

  const reenviar = async (respuestaId: string) => {
    setTrabajando(true);
    try {
      await reenviarCorreo(respuestaId);
      await refrescar();
    } finally {
      setTrabajando(false);
    }
  };

  const reintentarTodo = async () => {
    setTrabajando(true);
    try {
      await reintentarPendientes();
      await refrescar();
    } finally {
      setTrabajando(false);
    }
  };

  if (!autenticado) {
    return (
      <div className="panel">
        <h1 className="panel__titulo">Panel administrativo</h1>
        <form className="tarjeta" onSubmit={entrar}>
          <div className="tarjeta__encabezado">
            <span className="tarjeta__ojo">Acceso</span>
            <h2 className="tarjeta__titulo">Ingresa el token del panel</h2>
            <div className="subrayado-dorado" />
            <p className="tarjeta__bajada">
              Es el valor de <code>ENCUESTA_TOKEN_ADMIN</code> configurado en el servidor.
            </p>
          </div>
          <div className="campo">
            <label className="campo__etiqueta" htmlFor="token-admin">
              Token
            </label>
            <input
              id="token-admin"
              className="campo__entrada"
              type="password"
              value={token}
              onChange={(evento) => setToken(evento.target.value)}
              autoComplete="off"
            />
          </div>
          {error ? <p className="aviso">{error}</p> : null}
          <button type="submit" className="boton boton--primario">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="panel">
      <h1 className="panel__titulo">Panel administrativo</h1>

      {estadisticas ? (
        <>
          <div className="panel__metricas">
            <Metrica valor={estadisticas.totalRespuestas} etiqueta="Participantes" />
            <Metrica valor={estadisticas.respuestasHoy} etiqueta="Hoy" />
            <Metrica valor={estadisticas.autorizanComunicaciones} etiqueta="Autorizan contacto" />
            <Metrica valor={estadisticas.correosEnviados} etiqueta="Correos enviados" />
            <Metrica
              valor={estadisticas.correosPendientes + estadisticas.correosFallidos}
              etiqueta="Correos por reintentar"
            />
          </div>

          <div className="acciones">
            <a className="boton boton--secundario" href={urlExportacion()}>
              Exportar a Excel (CSV)
            </a>
            <button
              type="button"
              className="boton boton--fantasma"
              onClick={() => void reintentarTodo()}
              disabled={trabajando}
            >
              Reintentar envíos pendientes
            </button>
          </div>

          <Ranking titulo="🎙️ Qué quieren escuchar en la radio" conteos={estadisticas.temasRadio} />
          <Ranking titulo="🏢 Por qué vinieron a la Expo" conteos={estadisticas.motivosExpo} />
          <Ranking titulo="📍 Comunas" conteos={estadisticas.comunas} />
        </>
      ) : null}

      <div className="tarjeta">
        <h3 className="tarjeta__ojo">Participantes</h3>
        <div className="tabla__envoltorio">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Participante</th>
                <th>Contacto</th>
                <th>Radio</th>
                <th>Expo</th>
                <th>Autoriza</th>
                <th>Correo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {respuestas.map((respuesta) => (
                <tr key={respuesta.id}>
                  <td>
                    {formatearFechaCorta(respuesta.creadaEn)}
                    <br />
                    {formatearHora(respuesta.creadaEn)}
                  </td>
                  <td>
                    {respuesta.participante.nombre} {respuesta.participante.apellido}
                    <br />
                    {respuesta.participante.comuna}
                  </td>
                  <td>
                    {respuesta.participante.telefono}
                    <br />
                    {respuesta.participante.email}
                  </td>
                  <td>{etiquetasDe(TEMAS_RADIO, respuesta.temasRadio).join(', ')}</td>
                  <td>{etiquetasDe(MOTIVOS_EXPO, respuesta.motivosExpo).join(', ')}</td>
                  <td>{respuesta.autorizaComunicaciones ? 'Sí' : 'No'}</td>
                  <td>
                    <EstadoCorreo respuesta={respuesta} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => void reenviar(respuesta.id)}
                      disabled={trabajando}
                    >
                      Reenviar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
