import { defaultProjectConfig, defaultSettings } from '../domain/defaults';
import type { Database, Project } from '../domain/types';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * DATOS SEMILLA
 * ────────────────────────────────────────────────────────────────────────────
 * Regla del encargo: NO inventar información que no esté en los documentos.
 *
 * Esta semilla contiene EXCLUSIVAMENTE los datos que fueron enunciados de forma
 * explícita en el encargo: nombre del proyecto, dirección, comuna, los tres
 * hitos de conectividad nombrados y las tres tipologías nombradas.
 *
 * Todo lo demás (inmobiliaria, imágenes, brochure, amenities, terminaciones,
 * características, beneficios, superficies, plantas y, sobre todo, el stock con
 * sus precios y descuentos) queda VACÍO a propósito. Se carga desde el panel
 * administrador y desde la importación de la planilla Excel. La interfaz marca
 * estos campos como "pendiente de carga" en lugar de rellenarlos con supuestos.
 */

const NOW = '2026-01-01T00:00:00.000Z';

export const VISTA_AMUNATEGUI_ID = 'vista-amunategui';

export function seedProject(): Project {
  const config = defaultProjectConfig();
  return {
    id: VISTA_AMUNATEGUI_ID,
    nombre: 'Edificio Vista Amunátegui',
    // Sin dato en el encargo → configurable en el panel administrador.
    inmobiliaria: null,
    comuna: 'Santiago',
    direccion: 'Santa Isabel 4897, Santiago',
    descripcion: null,
    imagenPrincipal: null,
    galeria: [],
    brochureUrl: null,
    entorno: [],
    // Hitos de conectividad nombrados explícitamente en el encargo.
    conectividad: ['Metro Santa Ana', 'Metro Cal y Canto', 'Plaza de Armas'],
    caracteristicas: [],
    amenities: [],
    terminaciones: [],
    beneficios: [],
    tipologias: [
      {
        nombre: 'Estudio',
        dormitorios: 0,
        banos: 1,
        superficieUtil: null,
        superficieTerraza: null,
        superficieTotal: null,
        plantaUrl: null,
        nota: 'Superficies y planta pendientes de carga desde el brochure.',
      },
      {
        nombre: '1 dormitorio + 1 baño',
        dormitorios: 1,
        banos: 1,
        superficieUtil: null,
        superficieTerraza: null,
        superficieTotal: null,
        plantaUrl: null,
        nota: 'Superficies y planta pendientes de carga desde el brochure.',
      },
      {
        nombre: '2 dormitorios + 2 baños',
        dormitorios: 2,
        banos: 2,
        superficieUtil: null,
        superficieTerraza: null,
        superficieTotal: null,
        plantaUrl: null,
        nota: 'Superficies y planta pendientes de carga desde el brochure.',
      },
    ],
    config,
    publicado: true,
    updatedAt: NOW,
  };
}

export function seedDatabase(): Database {
  return {
    version: 1,
    projects: [seedProject()],
    // Sin stock: las unidades se cargan desde la planilla Excel.
    units: [],
    settings: defaultSettings(),
  };
}
