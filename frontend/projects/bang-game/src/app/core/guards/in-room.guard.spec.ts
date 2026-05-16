import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { canActivateInRoom } from './in-room.guard';
import { GameStateService } from '../../pages/game/game-state.service';
import { BotSessionService } from '../services/bot-session.service';
import { GamePhase } from '../models/game-state.model';

const makeGameStateStub = (phase: GamePhase) => ({ phase: signal(phase) });
const makeBotSessionStub = (isBotGame: boolean) => ({ isBotGame: signal(isBotGame) });
const makeRouterStub = () => ({ navigate: vi.fn() });

function setup(phase: GamePhase, isBotGame = false) {
  const router = makeRouterStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: GameStateService, useValue: makeGameStateStub(phase) },
      { provide: BotSessionService, useValue: makeBotSessionStub(isBotGame) },
      { provide: Router, useValue: router },
    ],
  });
  return { router };
}

describe('in-room.guard', () => {
  it('returns true when phase is not idle', () => {
    const { router } = setup('waiting-opponent');
    const result = TestBed.runInInjectionContext(() => canActivateInRoom());
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects to /lobby and returns false when phase is idle and no bot game', () => {
    const { router } = setup('idle', false);
    const result = TestBed.runInInjectionContext(() => canActivateInRoom());
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/lobby']);
  });

  it('returns true when phase is idle but isBotGame is true', () => {
    const { router } = setup('idle', true);
    const result = TestBed.runInInjectionContext(() => canActivateInRoom());
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // TRIANGULATE: in-game phases all pass
  it('returns true when phase is bang-active', () => {
    setup('bang-active');
    const result = TestBed.runInInjectionContext(() => canActivateInRoom());
    expect(result).toBe(true);
  });
});
