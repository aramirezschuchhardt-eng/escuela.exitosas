import { useCallback, useEffect, useMemo, useState } from 'react';

import { Encabezado } from './componentes/Encabezado.tsx';
import { BarraProgreso } from './componentes/BarraProgreso.tsx';
import { Bienvenida } from './pantallas/Bienvenida.tsx';
import { PasoDatos } from './pantallas/PasoDatos.tsx';
import { PasoOpciones } from './pantallas/PasoOpciones.tsx';
import { PasoCierre } from './pantallas/PasoCierre.tsx';
import { Confirmacion } from './pantallas/Confirmacion.tsx';
import { PanelAdmin } from './admin/PanelAdmin.tsx';
import { MOTIVOS_EXPO, PASOS, TEMAS_RADIO } from './compartido/definicion.ts';
import { PROGRAMA } from './compartido/marca.ts';
import {
  borradorVacio,
  erroresDelPaso,
  normalizarTelefono,
  telefonoEsValido,
  validarBorrador,
  type ErroresEncuesta,
} from './compartido/validacion.ts';
import type { Participante, RespuestaBorrador } from './compartido/tipos.ts';
import { enviarRespuesta } from './lib/api.ts';
import { encolar, vigilarCola } from './lib/cola.ts';

type Vista = 'bienvenida' | 'encuesta' | 'confirmacion';

function useRutaAdmin(): boolean {
  const [esAdmin, setEsAdmin] = useState(() => window.location.hash.startsWith('#/admin'));

  useEffect(() => {
    const alCambiar = () => setEsAdmin(window.location.hash.startsWith('#/admin'));
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  return esAdmin;
}

export default function App() {
  const esAdmin = useRutaAdmin();
  const [vista, setVista] = useState<Vista>('bienvenida');
  const [indicePaso, setIndicePaso] = useState(0);
  const [borrador, setBorrador] = useState<RespuestaBorrador>(borradorVacio);
  const [errores, setErrores] = useState<ErroresEncuesta>({});
  const [enviando, setEnviando] = useState(false);

  // La cola local reintenta sola lo que no se pudo enviar (wifi de la Expo).
  useEffect(() => vigilarCola(), []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [vista, indicePaso]);

  const paso = PASOS[indicePaso];

  const cambiarParticipante = useCallback((campo: keyof Participante, valor: string) => {
    setBorrador((actual) => ({ ...actual, participante: { ...actual.participante, [campo]: valor } }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  }, []);

  const alternar = useCallback((clave: 'temasRadio' | 'motivosExpo', id: string) => {
    setBorrador((actual) => {
      const seleccionados = actual[clave];
      const nuevos = seleccionados.includes(id)
        ? seleccionados.filter((valor) => valor !== id)
        : [...seleccionados, id];
      return { ...actual, [clave]: nuevos };
    });
    setErrores((actuales) => ({ ...actuales, [clave]: undefined }));
  }, []);

  const reiniciar = useCallback(() => {
    setBorrador(borradorVacio());
    setErrores({});
    setIndicePaso(0);
    setVista('bienvenida');
  }, []);

  const avanzar = useCallback(() => {
    const pasoActual = PASOS[indicePaso];
    if (!pasoActual) return;
    const problemas = erroresDelPaso(borrador, pasoActual.id);
    if (Object.keys(problemas).length > 0) {
      setErrores(problemas);
      return;
    }
    setErrores({});
    if (pasoActual.id === 'datos') {
      // Se deja el teléfono en un formato único para que el resumen y el
      // correo muestren lo mismo que guarda el servidor.
      setBorrador((actual) => ({
        ...actual,
        participante: {
          ...actual.participante,
          telefono: telefonoEsValido(actual.participante.telefono)
            ? normalizarTelefono(actual.participante.telefono)
            : actual.participante.telefono,
        },
      }));
    }
    setIndicePaso((valor) => Math.min(valor + 1, PASOS.length - 1));
  }, [borrador, indicePaso]);

  const retroceder = useCallback(() => {
    setErrores({});
    if (indicePaso === 0) {
      setVista('bienvenida');
      return;
    }
    setIndicePaso((valor) => Math.max(valor - 1, 0));
  }, [indicePaso]);

  /**
   * «¡YA ESTÁS PARTICIPANDO!»: guarda la respuesta y muestra la confirmación.
   * El correo a La Ruta Inmobiliaria sale del servidor en segundo plano, así
   * que la persona nunca ve un error técnico; si ni siquiera hay conexión, la
   * respuesta queda en la cola local y se reintenta sola.
   */
  const participar = useCallback(async () => {
    const problemas = validarBorrador(borrador);
    if (Object.keys(problemas).length > 0) {
      setErrores(problemas);
      const primerPaso = PASOS.findIndex(
        (candidato) => Object.keys(erroresDelPaso(borrador, candidato.id)).length > 0,
      );
      if (primerPaso >= 0) setIndicePaso(primerPaso);
      return;
    }

    setEnviando(true);
    try {
      await enviarRespuesta(borrador);
    } catch (error) {
      console.warn('La respuesta se guardó localmente y se reintentará', error);
      encolar(borrador);
    } finally {
      setEnviando(false);
      setVista('confirmacion');
    }
  }, [borrador]);

  const contenidoPaso = useMemo(() => {
    switch (paso?.id) {
      case 'datos':
        return <PasoDatos participante={borrador.participante} alCambiar={cambiarParticipante} errores={errores} />;
      case 'radio':
        return (
          <PasoOpciones
            ojo="Paso 2 de 4"
            titulo="🎙️ ¿Qué te gustaría escuchar en la radio?"
            bajada="Puedes marcar todas las alternativas que quieras."
            opciones={TEMAS_RADIO}
            seleccionados={borrador.temasRadio}
            alAlternar={(id) => alternar('temasRadio', id)}
            error={errores.temasRadio}
          />
        );
      case 'expo':
        return (
          <PasoOpciones
            ojo="Paso 3 de 4"
            titulo="🏢 ¿Por qué viniste a la Expo?"
            bajada="Marca todas las que correspondan."
            opciones={MOTIVOS_EXPO}
            seleccionados={borrador.motivosExpo}
            alAlternar={(id) => alternar('motivosExpo', id)}
            error={errores.motivosExpo}
          />
        );
      case 'cierre':
        return (
          <PasoCierre
            borrador={borrador}
            alAutorizar={(autoriza) =>
              setBorrador((actual) => ({ ...actual, autorizaComunicaciones: autoriza }))
            }
          />
        );
      default:
        return null;
    }
  }, [paso, borrador, errores, cambiarParticipante, alternar]);

  if (esAdmin) {
    return (
      <div className="app">
        <div className="contenedor">
          <Encabezado />
          <PanelAdmin />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="contenedor">
        <Encabezado />

        {vista === 'bienvenida' ? <Bienvenida alComenzar={() => setVista('encuesta')} /> : null}

        {vista === 'encuesta' ? (
          <>
            <BarraProgreso pasoActual={indicePaso} />
            {contenidoPaso}
            <div className="acciones acciones--fin">
              <button type="button" className="boton boton--fantasma" onClick={retroceder} disabled={enviando}>
                Volver
              </button>
              {indicePaso < PASOS.length - 1 ? (
                <button type="button" className="boton boton--primario" onClick={avanzar}>
                  Continuar
                </button>
              ) : (
                <button
                  type="button"
                  className="boton boton--destacado"
                  onClick={() => void participar()}
                  disabled={enviando}
                >
                  {enviando ? 'Enviando…' : '¡YA ESTÁS PARTICIPANDO!'}
                </button>
              )}
            </div>
          </>
        ) : null}

        {vista === 'confirmacion' ? <Confirmacion alReiniciar={reiniciar} /> : null}

        <p className="nota-pie">
          {PROGRAMA.nombre} · {PROGRAMA.emisora} · {PROGRAMA.horario}
        </p>
      </div>
    </div>
  );
}
