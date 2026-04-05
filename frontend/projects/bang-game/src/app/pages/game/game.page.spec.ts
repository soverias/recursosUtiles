import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { GamePage } from './game.page';
import { GameStateService } from './game-state.service';
import { GameHubService } from '../../core/services/game-hub.service';
import { AuthService } from '../../core/services/auth.service';
import { GamePhase } from '../../core/models/game-state.model';
import { RoomInfo, RoundResult } from '../../core/models/room.model';

const room: RoomInfo = { roomId: 'r1', opponentUsername: 'Bob' };
const roundResult: RoundResult = {
  winnerId: 'u1', loserId: 'u2',
  winnerReactionMs: 200, loserReactionMs: 350,
  isFalseStart: false,
};

const makeHubStub = () => ({
  on: vi.fn(),
  sendReady: vi.fn().mockResolvedValue(undefined),
  sendTap: vi.fn().mockResolvedValue(undefined),
  repeat: vi.fn().mockResolvedValue(undefined),
  leaveRoom: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
});

const makeAuthStub = () => ({
  currentUser: signal({ kind: 'authenticated', user: { id: 'u1', username: 'alice', token: 'jwt' } } as const),
});

describe('GamePage', () => {
  let fixture: ComponentFixture<GamePage>;
  let gameState: GameStateService;
  let hub: ReturnType<typeof makeHubStub>;

  const setup = (phase: GamePhase) => {
    hub = makeHubStub();
    TestBed.configureTestingModule({
      imports: [GamePage],
      providers: [
        provideRouter([]),
        GameStateService,
        { provide: GameHubService, useValue: hub },
        { provide: AuthService, useValue: makeAuthStub() },
      ],
    });
    fixture = TestBed.createComponent(GamePage);
    gameState = TestBed.inject(GameStateService);
    gameState.opponentJoined(room);
    if (phase !== 'waiting-opponent') {
      if (phase === 'both-ready' || phase === 'countdown' || phase === 'waiting-bang' || phase === 'bang-active' || phase === 'result') {
        gameState.bothReady();
      }
      if (phase === 'countdown' || phase === 'waiting-bang' || phase === 'bang-active' || phase === 'result') {
        gameState.countdownStart();
      }
      if (phase === 'waiting-bang' || phase === 'bang-active' || phase === 'result') {
        gameState.waitingBang();
      }
      if (phase === 'bang-active' || phase === 'result') {
        gameState.bang();
      }
      if (phase === 'result') {
        gameState.roundResult(roundResult);
      }
    }
    fixture.detectChanges();
  };

  it('shows "Listo" button and opponent name in waiting-opponent phase', () => {
    setup('waiting-opponent');
    expect(fixture.nativeElement.querySelector('[data-ready-btn]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Bob');
  });

  it('"Listo" button calls hub.sendReady', () => {
    setup('waiting-opponent');
    fixture.nativeElement.querySelector('[data-ready-btn]').click();
    expect(hub.sendReady).toHaveBeenCalledOnce();
  });

  it('shows countdown component in countdown phase', () => {
    setup('countdown');
    expect(fixture.nativeElement.querySelector('app-countdown')).not.toBeNull();
  });

  it('shows bang-button component in bang-active phase', () => {
    setup('bang-active');
    expect(fixture.nativeElement.querySelector('app-bang-button')).not.toBeNull();
  });

  it('shows result component in result phase', () => {
    setup('result');
    expect(fixture.nativeElement.querySelector('app-result')).not.toBeNull();
  });
});
