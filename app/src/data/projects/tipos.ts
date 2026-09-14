import type { Unit } from '../../domain/types';

/**
 * Forma de una unidad en los datos semilla: los campos que provienen de la
 * planilla. El `id`, el `projectId` y la trazabilidad se completan al cargar.
 */
export type UnitSeed = Omit<Unit, 'id' | 'projectId' | 'bonoPiePct' | 'extra' | 'source' | 'updatedAt'>;
