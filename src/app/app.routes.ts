import { Routes } from '@angular/router';
import { Chat } from './utilities/chat/chat';
import { ShuffleFriend } from './utilities/shuffle-friend/shuffle-friend';
import { BangGame } from './games/bang-game/bang-game';

export const routes: Routes = [
    { path: 'utilities/chat', component: Chat },
    { path: 'utilities/shufflefriend', component: ShuffleFriend },
    { path: 'games/bang', component: BangGame }
];
