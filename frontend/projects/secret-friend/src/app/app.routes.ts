import { Routes } from '@angular/router';
import { canActivateShuffle } from './guards/shuffle.guard';
import { canActivateReveal } from './guards/reveal.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'setup', pathMatch: 'full' },
  {
    path: 'setup',
    loadComponent: () => import('./pages/setup/setup.page').then(m => m.SetupPage),
  },
  {
    path: 'shuffle',
    loadComponent: () => import('./pages/shuffle/shuffle.page').then(m => m.ShufflePage),
    canActivate: [canActivateShuffle],
  },
  {
    path: 'reveal',
    loadComponent: () => import('./pages/reveal/reveal.page').then(m => m.RevealPage),
    canActivate: [canActivateReveal],
  },
  { path: '**', redirectTo: 'setup' },
];
