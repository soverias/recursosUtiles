import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameService } from '../services/game.service';

export const canActivateReveal: CanActivateFn = () => {
  const game = inject(GameService);
  const router = inject(Router);
  return game.assignments().length > 0 ? true : router.createUrlTree(['/setup']);
};
