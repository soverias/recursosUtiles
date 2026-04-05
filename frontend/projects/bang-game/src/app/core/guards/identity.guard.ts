import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function canActivateIdentity(): boolean {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser().kind !== 'anonymous') return true;

  router.navigate(['/entry']);
  return false;
}
