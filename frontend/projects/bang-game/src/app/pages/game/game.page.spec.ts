import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { GamePage } from './game.page';
import { GameStateService } from './game-state.service';
import { GameHubService } from '../../core/services/game-hub.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '@shared/ui';
import { BotSessionService } from '../../core/services/bot-session.service';
import { BotGameService } from '../../core/services/bot-game.service';
import { GamePhase } from '../../core/models/game-state.model';
import { RoomInfo, RoundResult } from '../../core/models/room.model';

const room: RoomInfo = { roomId: 'r1', opponentUsername: 'Bob', myUsername: 'Me' };
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

const makeBotSessionStub = (isBotGame = false) => ({
  isBotGame: signal(isBotGame),
  difficulty: signal<'easy' | 'medium' | 'hard'>('medium'),
  opponentName: signal('Pistolero'),
  startBotSession: vi.fn(),
  endBotSession: vi.fn(),
});

const makeBotGameStub = () => ({
  startGame: vi.fn(),
  playerReady: vi.fn(),
  playerTapped: vi.fn(),
  rematch: vi.fn(),
  abandon: vi.fn(),
  reset: vi.fn(),
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

  it('does not show opponent-ready badge initially', () => {
    setup('waiting-opponent');
    expect(fixture.nativeElement.querySelector('[data-opponent-ready]')).toBeNull();
  });

  it('shows opponent-ready badge when opponent is ready', () => {
    setup('waiting-opponent');
    gameState.opponentReady();
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('[data-opponent-ready]');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('Bob');
  });

  it('"Listo" button calls hub.sendReady', () => {
    setup('waiting-opponent');
    fixture.nativeElement.querySelector('[data-ready-btn]').click();
    expect(hub.sendReady).toHaveBeenCalledOnce();
  });

  it('shows bang-button with countdown label in countdown phase', () => {
    vi.useFakeTimers();
    setup('countdown');
    expect(fixture.nativeElement.querySelector('app-bang-button')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Preparados');
    vi.useRealTimers();
  });

  it('shows bang-button component in bang-active phase', () => {
    setup('bang-active');
    expect(fixture.nativeElement.querySelector('app-bang-button')).not.toBeNull();
  });

  it('shows result component in result phase', () => {
    setup('result');
    expect(fixture.nativeElement.querySelector('app-result')).not.toBeNull();
  });

  // --- OpponentLeft ---

  describe('OpponentLeft', () => {
    let router: Router;
    let toast: { show: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      vi.useFakeTimers();
      setup('result');
      router = TestBed.inject(Router);
      toast = TestBed.inject(ToastService) as unknown as typeof toast;
      vi.spyOn(toast, 'show');
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const fireOpponentLeft = () => {
      const [, cb] = hub.on.mock.calls.find(([event]) => event === 'OpponentLeft')!;
      (cb as () => void)();
    };

    it('shows toast immediately when opponent leaves', () => {
      fireOpponentLeft();
      expect(toast.show).toHaveBeenCalledOnce();
    });

    it('does not navigate before 5 seconds', () => {
      fireOpponentLeft();
      vi.advanceTimersByTime(4999);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('navigates to lobby after 5 seconds', () => {
      fireOpponentLeft();
      vi.advanceTimersByTime(5000);
      expect(router.navigate).toHaveBeenCalledWith(['/lobby']);
    });

    it('does not reset game state before 5 seconds', () => {
      fireOpponentLeft();
      vi.advanceTimersByTime(4999);
      expect(gameState.phase()).not.toBe('idle');
    });

    it('resets game state after 5 seconds', () => {
      fireOpponentLeft();
      vi.advanceTimersByTime(5000);
      expect(gameState.phase()).toBe('idle');
    });
  });

  // --- Modo bot ---

  describe('modo bot', () => {
    let botSession: ReturnType<typeof makeBotSessionStub>;
    let botGame: ReturnType<typeof makeBotGameStub>;
    let router: Router;

    const setupBot = (phase: GamePhase = 'waiting-opponent') => {
      hub = makeHubStub();
      botSession = makeBotSessionStub(true);
      botGame = makeBotGameStub();
      TestBed.configureTestingModule({
        imports: [GamePage],
        providers: [
          provideRouter([]),
          GameStateService,
          { provide: GameHubService, useValue: hub },
          { provide: AuthService, useValue: makeAuthStub() },
          { provide: BotSessionService, useValue: botSession },
          { provide: BotGameService, useValue: botGame },
        ],
      });
      fixture = TestBed.createComponent(GamePage);
      gameState = TestBed.inject(GameStateService);
      router = TestBed.inject(Router);
      gameState.opponentJoined(room);
      if (phase === 'result') {
        gameState.bothReady();
        gameState.countdownStart();
        gameState.waitingBang();
        gameState.bang();
        gameState.roundResult(roundResult);
      }
      fixture.detectChanges();
    };

    it('ngOnInit en modo bot llama botGame.startGame()', () => {
      setupBot();
      expect(botGame.startGame).toHaveBeenCalledOnce();
    });

    it('ngOnInit en modo bot NO registra handlers de SignalR (hub.on no se llama)', () => {
      setupBot();
      expect(hub.on).not.toHaveBeenCalled();
    });

    it('onTap() en modo bot delega a botGame.playerTapped()', () => {
      setupBot();
      fixture.componentInstance.onTap();
      expect(botGame.playerTapped).toHaveBeenCalledOnce();
      expect(hub.sendTap).not.toHaveBeenCalled();
    });

    it('onReady() en modo bot delega a botGame.playerReady()', () => {
      setupBot();
      fixture.componentInstance.onReady();
      expect(botGame.playerReady).toHaveBeenCalledOnce();
      expect(hub.sendReady).not.toHaveBeenCalled();
    });

    it('onRepeat() en modo bot llama gameState.waitingRematch() y botGame.rematch()', () => {
      setupBot('result');
      vi.spyOn(gameState, 'waitingRematch');
      fixture.componentInstance.onRepeat();
      expect(gameState.waitingRematch).toHaveBeenCalledOnce();
      expect(botGame.rematch).toHaveBeenCalledOnce();
      expect(hub.repeat).not.toHaveBeenCalled();
    });

    it('onPlayOther() en modo bot llama botGame.abandon() y navega a /lobby', async () => {
      setupBot('result');
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      await fixture.componentInstance.onPlayOther();
      expect(botGame.abandon).toHaveBeenCalledOnce();
      expect(router.navigate).toHaveBeenCalledWith(['/lobby']);
      expect(hub.leaveRoom).not.toHaveBeenCalled();
    });

    it('ngOnDestroy en modo bot llama botGame.reset() y botSession.endBotSession()', () => {
      setupBot();
      fixture.destroy();
      expect(botGame.reset).toHaveBeenCalledOnce();
      expect(botSession.endBotSession).toHaveBeenCalledOnce();
    });

    it('en modo bot, ningún método llama a GameHubService', async () => {
      setupBot('result');
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fixture.componentInstance.onReady();
      fixture.componentInstance.onTap();
      fixture.componentInstance.onRepeat();
      await fixture.componentInstance.onPlayOther();
      // hub.on ya fue verificado en ngOnInit; hub.sendReady, sendTap, repeat, leaveRoom no deben haberse llamado
      expect(hub.sendReady).not.toHaveBeenCalled();
      expect(hub.sendTap).not.toHaveBeenCalled();
      expect(hub.repeat).not.toHaveBeenCalled();
      expect(hub.leaveRoom).not.toHaveBeenCalled();
    });
  });
});
