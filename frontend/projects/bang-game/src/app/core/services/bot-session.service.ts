import { computed, Injectable, signal } from '@angular/core';
import { BOT_DIFFICULTY_CONFIGS, BotDifficulty } from '../models/bot.model';

@Injectable({ providedIn: 'root' })
export class BotSessionService {
  readonly isBotGame = signal(false);
  readonly difficulty = signal<BotDifficulty>('medium');
  readonly opponentName = computed(() => BOT_DIFFICULTY_CONFIGS[this.difficulty()].botName);

  startBotSession(difficulty: BotDifficulty): void {
    this.difficulty.set(difficulty);
    this.isBotGame.set(true);
  }

  endBotSession(): void {
    this.isBotGame.set(false);
    this.difficulty.set('medium');
  }
}
