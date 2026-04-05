import { Routes } from '@angular/router';
import { canActivateIdentity } from './core/guards/identity.guard';
import { canActivateInRoom } from './core/guards/in-room.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'entry', pathMatch: 'full' },
  {
    path: 'entry',
    loadComponent: () => import('./pages/entry/entry.page').then(m => m.EntryPage),
  },
  {
    path: 'lobby',
    loadComponent: () => import('./pages/lobby/lobby.page').then(m => m.LobbyPage),
    canActivate: [canActivateIdentity],
  },
  {
    path: 'game',
    loadComponent: () => import('./pages/game/game.page').then(m => m.GamePage),
    canActivate: [canActivateIdentity, canActivateInRoom],
  },
  {
    path: 'ranking',
    loadComponent: () => import('./pages/ranking/ranking.page').then(m => m.RankingPage),
  },
  { path: '**', redirectTo: 'entry' },
];
