import { Injectable, signal } from '@angular/core';
import { GamePhase } from '../../core/models/game-state.model';
import { RoomInfo, RoundResult } from '../../core/models/room.model';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  readonly phase = signal<GamePhase>('idle');
  readonly room = signal<RoomInfo | null>(null);
  readonly lastResult = signal<RoundResult | null>(null);
  readonly tapConsumed = signal(false);
  readonly myUsername = signal<string>('');
  readonly countdownLabel = signal('');
  readonly opponentIsReady = signal(false);
  readonly opponentWantsRepeat = signal(false);

  private _countdownHandle: ReturnType<typeof setInterval> | null = null;
  private static readonly COUNTDOWN_STEPS = ['Preparados', 'Listos'];

  opponentJoined(info: RoomInfo): void {
    this.room.set(info);
    this.myUsername.set(info.myUsername);
    this.phase.set('waiting-opponent');
  }

  bothReady(): void {
    this.opponentIsReady.set(false);
    this.phase.set('both-ready');
  }

  countdownStart(): void {
    const steps = GameStateService.COUNTDOWN_STEPS;
    let step = 0;
    this.countdownLabel.set(steps[0]);
    this._countdownHandle = setInterval(() => {
      step++;
      if (step < steps.length) {
        this.countdownLabel.set(steps[step]);
      } else {
        clearInterval(this._countdownHandle!);
        this._countdownHandle = null;
      }
    }, 1000);
    this.phase.set('countdown');
  }

  waitingBang(): void {
    this._clearCountdown();
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

  opponentReady(): void {
    this.opponentIsReady.set(true);
  }

  opponentWantsRematch(): void {
    this.opponentWantsRepeat.set(true);
  }

  waitingRematch(): void {
    this.lastResult.set(null);
    this.tapConsumed.set(false);
    this.opponentWantsRepeat.set(false);
    this.phase.set('waiting-rematch');
  }

  reset(): void {
    this._clearCountdown();
    this.phase.set('idle');
    this.room.set(null);
    this.lastResult.set(null);
    this.tapConsumed.set(false);
    this.opponentIsReady.set(false);
    this.opponentWantsRepeat.set(false);
  }

  private _clearCountdown(): void {
    if (this._countdownHandle !== null) {
      clearInterval(this._countdownHandle);
      this._countdownHandle = null;
    }
    this.countdownLabel.set('');
  }
}
