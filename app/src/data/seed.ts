import { defaultSettings } from '../domain/defaults';
import type { Database, Unit } from '../domain/types';
import { VISTA_AMUNATEGUI_ID, vistaAmunateguiProject } from './projects/vista-amunategui';
import { VISTA_AMUNATEGUI_UNITS } from './projects/vista-amunategui-units';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * DATOS SEMILLA
 * ────────────────────────────────────────────────────────────────────────────
 * Todo lo que hay aquí proviene de los documentos entregados: el brochure del
 * Edificio Vista Amunátegui y la planilla general de stock de AJ Urbana.
 *
 * El stock se puede reemplazar en cualquier momento desde el panel
 * administrador importando una planilla actualizada; esta semilla es el punto
 * de partida, no la fuente permanente.
 */

/**
 * Valor de la UF con el que trabaja la planilla general (celda «Valor UF» de la
 * hoja «Info Com»). El administrador debe mantenerlo actualizado.
 */
export const UF_PLANILLA = 40901.94;
export const UF_PLANILLA_FECHA = '2025-09-01T00:00:00.000Z';

/** Id determinista por unidad, para que reimportar no duplique el stock. */
function unitId(departamento: string): string {
  return `${VISTA_AMUNATEGUI_ID}-${departamento.trim().toUpperCase()}`;
}

export function seedUnits(): Unit[] {
  return VISTA_AMUNATEGUI_UNITS.map((u) => ({
    ...u,
    id: unitId(u.departamento),
    projectId: VISTA_AMUNATEGUI_ID,
    bonoPiePct: null,
    extra: {},
    source: 'excel' as const,
    updatedAt: UF_PLANILLA_FECHA,
  }));
}

export function seedDatabase(): Database {
  const settings = defaultSettings();
  return {
    version: 2,
    projects: [vistaAmunateguiProject()],
    units: seedUnits(),
    settings: {
      ...settings,
      ufValue: UF_PLANILLA,
      ufActualizadaEl: UF_PLANILLA_FECHA,
    },
  };
}

export { VISTA_AMUNATEGUI_ID };
