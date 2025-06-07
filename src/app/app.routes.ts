import { Routes } from '@angular/router';
import { ShuffleFriend } from './utilities/shuffle-friend/shuffle-friend';
import { BangGame } from './games/bang-game/bang-game';
import { ChatManager } from './utilities/chat-manager/chat-manager';

export const routes: Routes = [
    { path: 'utilities/chat', component: ChatManager },
    { path: 'utilities/shufflefriend', component: ShuffleFriend },
    { path: 'games/bang', component: BangGame }
];
