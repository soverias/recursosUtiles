import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly PREFIX = 'secret-friend:';

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw !== null ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }
}
