import { Injectable, signal } from '@angular/core';
import { GamePhase } from '../../core/models/game-state.model';
import { RoomInfo, RoundResult } from '../../core/models/room.model';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  readonly phase = signal<GamePhase>('idle');
  readonly room = signal<RoomInfo | null>(null);
  readonly lastResult = signal<RoundResult | null>(null);
  readonly tapConsumed = signal(false);

  opponentJoined(info: RoomInfo): void {
    this.room.set(info);
    this.phase.set('waiting-opponent');
  }

  bothReady(): void {
    this.phase.set('both-ready');
  }

  countdownStart(): void {
    this.phase.set('countdown');
  }

  waitingBang(): void {
    this.phase.set('waiting-bang');
  }

  bang(): void {
    this.tapConsumed.set(false);
    this.phase.set('bang-active');
  }

  consumeTap(): void {
    this.tapConsumed.set(true);
  }

  roundResult(result: RoundResult): void {
    this.lastResult.set(result);
    this.phase.set('result');
  }

  reset(): void {
    this.phase.set('idle');
    this.room.set(null);
    this.lastResult.set(null);
    this.tapConsumed.set(false);
  }
}
