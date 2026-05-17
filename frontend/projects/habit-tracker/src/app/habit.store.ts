import { Injectable } from '@angular/core';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  marks: string[];      // sorted YYYY-MM-DD strings
  createdAt: number;
}

const DB_NAME = 'habit-tracker';
const STORE_NAME = 'habits';
const DB_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class HabitStore {
  private readonly dbPromise: Promise<IDBDatabase | null> = this.open();

  private open(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async list(): Promise<Habit[]> {
    const db = await this.dbPromise;
    if (!db) return [];
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .getAll();
      req.onsuccess = () => {
        const items = (req.result as Habit[]).slice();
        items.sort((a, b) => a.createdAt - b.createdAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async put(habit: Habit): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE_NAME, 'readwrite')
        .objectStore(STORE_NAME)
        .put(habit);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE_NAME, 'readwrite')
        .objectStore(STORE_NAME)
        .delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
