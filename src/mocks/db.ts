// In-memory "database" for the mock API, saved to localStorage so changes survive a page reload.
import { createSeed, type SeedData } from './data/seed';

const STORAGE_KEY = 'adminflow:mock-db:v1';

export interface Db extends SeedData {
  /** token → user id */
  sessions: Record<string, string>;
}

let db: Db | null = null;

function load(): Db | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Db) : null;
  } catch {
    return null; // storage blocked or corrupt: start from the seed
  }
}

export function getDb(): Db {
  db ??= load() ?? { ...createSeed(), sessions: {} };
  return db;
}

export function saveDb(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getDb()));
  } catch {
    // Private mode or quota: the data still works for this page view.
  }
}

/** Back to the seed data (used by tests, and by `?mock-reset` in the browser). */
export function resetDb(): void {
  db = { ...createSeed(), sessions: {} };
  saveDb();
}

/** Random id that works in insecure contexts too (`crypto.randomUUID` needs HTTPS or localhost). */
export function randomId(prefix = ''): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return prefix + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
