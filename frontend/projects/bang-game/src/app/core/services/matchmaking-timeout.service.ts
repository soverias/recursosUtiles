import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MatchmakingTimeoutService {
  private _timeoutId: ReturnType<typeof setTimeout> | null = null;
  readonly expired = signal(false);

  start(durationMs: number = 30_000): void {
    this.cancel();
    this._timeoutId = setTimeout(() => {
      this.expired.set(true);
    }, durationMs);
  }

  cancel(): void {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    this.expired.set(false);
  }
}
