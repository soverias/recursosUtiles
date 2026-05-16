import { Injectable, signal } from '@angular/core';
import { HistoryEntry } from '../models/options.model';

const STORAGE_KEY = 'pwgen_history';
const MAX_ENTRIES = 10;

@Injectable({ providedIn: 'root' })
export class HistoryService {
  readonly entries = signal<HistoryEntry[]>(this.load());

  add(password: string): void {
    if (!password) return;
    const entry: HistoryEntry = { password, createdAt: Date.now() };
    const next = [entry, ...this.entries()].slice(0, MAX_ENTRIES);
    this.entries.set(next);
    this.persist(next);
  }

  remove(index: number): void {
    const next = this.entries().filter((_, i) => i !== index);
    this.entries.set(next);
    this.persist(next);
  }

  clear(): void {
    this.entries.set([]);
    this.persist([]);
  }

  private load(): HistoryEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
    } catch {
      return [];
    }
  }

  private persist(entries: HistoryEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }
}
