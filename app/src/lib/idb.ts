'use client';

/**
 * Tiny IndexedDB wrapper — native API, no extra deps.
 * Stores arbitrary serializable values (Blobs, Files, JSON) keyed by string.
 *
 * Usage:
 *   await idbSet('image:0', fileObject);
 *   const file = await idbGet<File>('image:0');
 *   await idbDelete('image:0');
 *   const keys = await idbKeys();
 *   // no clear() helper (avoid accidental data loss)
 */

const DB_NAME = 'p0021-studio';
const DB_VERSION = 1;
const STORE = 'files';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable (SSR)'));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        const req = run(store);
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      })
  );
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  await tx('readwrite', (s) => s.put(value, key));
}

export async function idbGet<T = unknown>(key: string): Promise<T | null> {
  const r = await tx<unknown>('readonly', (s) => s.get(key));
  return (r as T) ?? null;
}

export async function idbDelete(key: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(key));
}

export async function idbKeys(): Promise<string[]> {
  return openDB().then(
    (db) =>
      new Promise<string[]>((resolve, reject) => {
        const t = db.transaction(STORE, 'readonly');
        const req = t.objectStore(STORE).getAllKeys();
        req.onsuccess = () => resolve(req.result as string[]);
        req.onerror = () => reject(req.error);
      })
  );
}

// (intentionally no clear() export; keep API minimal and avoid accidental data loss)
