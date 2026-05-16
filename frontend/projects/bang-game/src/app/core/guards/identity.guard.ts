import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export function canActivateIdentity(): boolean {
  const auth = inject(AuthService);

  if (auth.currentUser().kind !== 'anonymous') return true;

  auth.playAsGuest();
  return true;
}
