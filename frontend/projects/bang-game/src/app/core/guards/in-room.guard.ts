import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../pages/game/game-state.service';
import { BotSessionService } from '../services/bot-session.service';

export function canActivateInRoom(): boolean {
  const gameState = inject(GameStateService);
  const botSession = inject(BotSessionService);
  const router = inject(Router);

  if (gameState.phase() !== 'idle' || botSession.isBotGame()) return true;

  router.navigate(['/lobby']);
  return false;
}
