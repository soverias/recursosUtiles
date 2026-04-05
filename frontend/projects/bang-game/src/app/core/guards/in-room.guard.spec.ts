import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { canActivateInRoom } from './in-room.guard';
import { GameStateService } from '../../pages/game/game-state.service';
import { GamePhase } from '../models/game-state.model';

const makeGameStateStub = (phase: GamePhase) => ({ phase: signal(phase) });
const makeRouterStub = () => ({ navigate: vi.fn() });

describe('in-room.guard', () => {
  let router: ReturnType<typeof makeRouterStub>;

  beforeEach(() => {
    router = makeRouterStub();
  });

  it('returns true when phase is not idle', () => {
    const gameState = makeGameStateStub('waiting-opponent');
    TestBed.configureTestingModule({
      providers: [
        { provide: GameStateService, useValue: gameState },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => canActivateInRoom());
    expect(result).toBe(true);
  });

  it('redirects to /lobby and returns false when phase is idle', () => {
    const gameState = makeGameStateStub('idle');
    TestBed.configureTestingModule({
      providers: [
        { provide: GameStateService, useValue: gameState },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => canActivateInRoom());
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/lobby']);
  });

  // TRIANGULATE: in-game phases all pass
  it('returns true when phase is bang-active', () => {
    const gameState = makeGameStateStub('bang-active');
    TestBed.configureTestingModule({
      providers: [
        { provide: GameStateService, useValue: gameState },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => canActivateInRoom());
    expect(result).toBe(true);
  });
});
