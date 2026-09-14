import type { Database } from '../domain/types';
import { seedDatabase } from './seed';

/**
 * Puerto de persistencia.
 *
 * Toda la aplicación habla con esta interfaz y nunca con `localStorage`
 * directamente. Cuando exista backend, basta con escribir una
 * `ApiRepository implements Repository` y cambiar la instancia exportada al
 * final de este archivo: ningún componente necesita modificarse.
 */
export interface Repository {
  load(): Promise<Database>;
  save(db: Database): Promise<void>;
  reset(): Promise<Database>;
}

const STORAGE_KEY = 'cotizador-inmobiliario:db:v1';

export class LocalStorageRepository implements Repository {
  async load(): Promise<Database> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = seedDatabase();
        await this.save(fresh);
        return fresh;
      }
      const parsed = JSON.parse(raw) as Database;
      return migrate(parsed);
    } catch {
      // Datos corruptos o almacenamiento bloqueado: se parte de la semilla.
      return seedDatabase();
    }
  }

  async save(db: Database): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (error) {
      // Cuota excedida o almacenamiento deshabilitado: se avisa, no se rompe.
      console.error('No fue posible guardar los datos localmente.', error);
      throw new Error(
        'No fue posible guardar los cambios. Revise el espacio disponible del navegador ' +
          '(las imágenes en base64 ocupan bastante).',
      );
    }
  }

  async reset(): Promise<Database> {
    const fresh = seedDatabase();
    await this.save(fresh);
    return fresh;
  }
}

/** Rellena campos que pudieran faltar en bases guardadas por versiones previas. */
function migrate(db: Database): Database {
  const seed = seedDatabase();
  return {
    version: seed.version,
    projects: (db.projects ?? []).map((p) => ({
      ...seed.projects[0],
      ...p,
      config: { ...seed.projects[0].config, ...p.config },
    })),
    units: db.units ?? [],
    settings: { ...seed.settings, ...db.settings, brand: { ...seed.settings.brand, ...db.settings?.brand } },
  };
}

export const repository: Repository = new LocalStorageRepository();
