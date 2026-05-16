import { Injectable, signal } from '@angular/core';
import { HistoryEntry } from '../models/expression.model';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  readonly entries = signal<readonly HistoryEntry[]>([]);

  addEntry(entry: HistoryEntry): void {
    this.entries.update(list => [entry, ...list]);
  }

  clearHistory(): void {
    this.entries.set([]);
  }
}
