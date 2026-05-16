import { Injectable, inject } from '@angular/core';
import { BotSessionService } from './bot-session.service';
import { GameStateService } from '../../pages/game/game-state.service';
import { BOT_DIFFICULTY_CONFIGS } from '../models/bot.model';

@Injectable({ providedIn: 'root' })
export class BotGameService {
  private readonly _botSession = inject(BotSessionService);
  private readonly _gameState = inject(GameStateService);

  private _readyTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private _countdownTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private _bangDelayId: ReturnType<typeof setTimeout> | null = null;
  private _botTapTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private _botFalseStartId: ReturnType<typeof setTimeout> | null = null;
  private _bangTimestamp = 0;
  private _botReactionMs = 0;

  static readonly BOT_FALSE_START_PROBABILITY = 0.05;

  startGame(): void {
    this._gameState.opponentJoined({
      roomId: 'bot-room',
      opponentUsername: this._botSession.opponentName(),
      myUsername: this._gameState.myUsername(),
    });
  }

  playerReady(): void {
    const readyDelay = Math.floor(Math.random() * (800 - 300) + 300);
    this._readyTimeoutId = setTimeout(() => {
      this._readyTimeoutId = null;
      this._gameState.bothReady();

      this._countdownTimeoutId = setTimeout(() => {
        this._countdownTimeoutId = null;
        this._gameState.countdownStart();

        setTimeout(() => {
          this._gameState.waitingBang();
          this._scheduleBang();
        }, 2500);
      }, 1000);
    }, readyDelay);
  }

  playerTapped(): void {
    const phase = this._gameState.phase();

    if (phase === 'waiting-bang') {
      if (this._bangDelayId !== null) {
        clearTimeout(this._bangDelayId);
        this._bangDelayId = null;
      }
      if (this._botTapTimeoutId !== null) {
        clearTimeout(this._botTapTimeoutId);
        this._botTapTimeoutId = null;
      }
      this._gameState.consumeTap();
      this._gameState.roundResult({
        winnerId: this._botSession.opponentName(),
        loserId: this._gameState.myUsername(),
        winnerReactionMs: 0,
        loserReactionMs: 0,
        isFalseStart: true,
      });
      return;
    }

    if (phase === 'bang-active') {
      const playerReactionMs = Date.now() - this._bangTimestamp;
      if (this._botTapTimeoutId !== null) {
        clearTimeout(this._botTapTimeoutId);
        this._botTapTimeoutId = null;
      }
      this._gameState.consumeTap();

      if (playerReactionMs <= this._botReactionMs) {
        this._gameState.roundResult({
          winnerId: this._gameState.myUsername(),
          loserId: this._botSession.opponentName(),
          winnerReactionMs: playerReactionMs,
          loserReactionMs: this._botReactionMs,
          isFalseStart: false,
        });
      } else {
        this._gameState.roundResult({
          winnerId: this._botSession.opponentName(),
          loserId: this._gameState.myUsername(),
          winnerReactionMs: this._botReactionMs,
          loserReactionMs: playerReactionMs,
          isFalseStart: false,
        });
      }
    }
  }

  rematch(): void {
    this._gameState.opponentWantsRematch();
    this.reset();
    this.startGame();
  }

  abandon(): void {
    this.reset();
    this._gameState.reset();
  }

  reset(): void {
    if (this._readyTimeoutId !== null) {
      clearTimeout(this._readyTimeoutId);
      this._readyTimeoutId = null;
    }
    if (this._countdownTimeoutId !== null) {
      clearTimeout(this._countdownTimeoutId);
      this._countdownTimeoutId = null;
    }
    if (this._bangDelayId !== null) {
      clearTimeout(this._bangDelayId);
      this._bangDelayId = null;
    }
    if (this._botTapTimeoutId !== null) {
      clearTimeout(this._botTapTimeoutId);
      this._botTapTimeoutId = null;
    }
    if (this._botFalseStartId !== null) {
      clearTimeout(this._botFalseStartId);
      this._botFalseStartId = null;
    }
    this._bangTimestamp = 0;
    this._botReactionMs = 0;
  }

  private _scheduleBang(): void {
    if (
      this._botSession.difficulty() === 'hard' &&
      Math.random() < BotGameService.BOT_FALSE_START_PROBABILITY
    ) {
      const falseStartDelay = Math.floor(Math.random() * (2000 - 500) + 500);
      this._botFalseStartId = setTimeout(() => {
        this._botFalseStartId = null;
        if (this._gameState.phase() === 'waiting-bang') {
          if (this._bangDelayId !== null) {
            clearTimeout(this._bangDelayId);
            this._bangDelayId = null;
          }
          this._gameState.roundResult({
            winnerId: this._gameState.myUsername(),
            loserId: this._botSession.opponentName(),
            winnerReactionMs: 0,
            loserReactionMs: 0,
            isFalseStart: true,
          });
        }
      }, falseStartDelay);
    }

    const bangDelay = Math.floor(Math.random() * (4000 - 1500) + 1500);
    this._bangDelayId = setTimeout(() => {
      this._bangDelayId = null;
      this._gameState.bang();
      this._bangTimestamp = Date.now();

      const cfg = BOT_DIFFICULTY_CONFIGS[this._botSession.difficulty()];
      this._botReactionMs = Math.floor(
        Math.random() * (cfg.maxReactionMs - cfg.minReactionMs) + cfg.minReactionMs
      );

      this._botTapTimeoutId = setTimeout(() => {
        this._botTapTimeoutId = null;
        if (this._gameState.phase() === 'bang-active') {
          this._gameState.roundResult({
            winnerId: this._botSession.opponentName(),
            loserId: this._gameState.myUsername(),
            winnerReactionMs: this._botReactionMs,
            loserReactionMs: this._botReactionMs + 1,
            isFalseStart: false,
          });
        }
      }, this._botReactionMs);
    }, bangDelay);
  }
}
