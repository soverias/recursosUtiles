import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../pages/game/game-state.service';

export function canActivateInRoom(): boolean {
  const gameState = inject(GameStateService);
  const router = inject(Router);

  if (gameState.phase() !== 'idle') return true;

  router.navigate(['/lobby']);
  return false;
}
