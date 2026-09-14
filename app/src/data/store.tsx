import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { repository } from './repository';
import type { AppSettings, Database, Project, Unit } from '../domain/types';

interface StoreValue {
  db: Database | null;
  cargando: boolean;
  projects: Project[];
  units: Unit[];
  settings: AppSettings | null;
  getProject: (id: string) => Project | undefined;
  unitsOf: (projectId: string) => Unit[];
  saveProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  saveUnit: (unit: Unit) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  replaceUnits: (units: Unit[]) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  resetAll: () => Promise<void>;
  importDatabase: (db: Database) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    repository
      .load()
      .then(setDb)
      .finally(() => setCargando(false));
  }, []);

  const persist = useCallback(async (next: Database) => {
    setDb(next);
    await repository.save(next);
  }, []);

  const value = useMemo<StoreValue>(() => {
    const projects = db?.projects ?? [];
    const units = db?.units ?? [];

    const touch = (p: Project): Project => ({ ...p, updatedAt: new Date().toISOString() });

    return {
      db,
      cargando,
      projects,
      units,
      settings: db?.settings ?? null,
      getProject: (id) => projects.find((p) => p.id === id),
      unitsOf: (projectId) => units.filter((u) => u.projectId === projectId),

      saveProject: async (project) => {
        if (!db) return;
        const existe = db.projects.some((p) => p.id === project.id);
        await persist({
          ...db,
          projects: existe
            ? db.projects.map((p) => (p.id === project.id ? touch(project) : p))
            : [...db.projects, touch(project)],
        });
      },

      deleteProject: async (id) => {
        if (!db) return;
        await persist({
          ...db,
          projects: db.projects.filter((p) => p.id !== id),
          units: db.units.filter((u) => u.projectId !== id),
        });
      },

      saveUnit: async (unit) => {
        if (!db) return;
        const stamped = { ...unit, updatedAt: new Date().toISOString() };
        const existe = db.units.some((u) => u.id === unit.id);
        await persist({
          ...db,
          units: existe
            ? db.units.map((u) => (u.id === unit.id ? stamped : u))
            : [...db.units, stamped],
        });
      },

      deleteUnit: async (id) => {
        if (!db) return;
        await persist({ ...db, units: db.units.filter((u) => u.id !== id) });
      },

      replaceUnits: async (nextUnits) => {
        if (!db) return;
        await persist({ ...db, units: nextUnits });
      },

      saveSettings: async (settings) => {
        if (!db) return;
        await persist({ ...db, settings });
      },

      resetAll: async () => {
        const fresh = await repository.reset();
        setDb(fresh);
      },

      importDatabase: async (next) => {
        await persist(next);
      },
    };
  }, [db, cargando, persist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>.');
  return ctx;
}
