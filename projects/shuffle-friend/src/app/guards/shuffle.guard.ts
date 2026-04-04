import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameService } from '../services/game.service';

export const canActivateShuffle: CanActivateFn = () => {
  const game = inject(GameService);
  const router = inject(Router);
  return game.participants().length >= 3 ? true : router.createUrlTree(['/setup']);
};
