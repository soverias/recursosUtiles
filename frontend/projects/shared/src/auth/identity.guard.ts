import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Ensures the user has some identity (authenticated or guest).
 * If anonymous, transparently promotes to guest. Always returns true.
 */
export function canActivateIdentity(): boolean {
  const auth = inject(AuthService);

  if (auth.currentUser().kind !== 'anonymous') return true;

  auth.playAsGuest();
  return true;
}
