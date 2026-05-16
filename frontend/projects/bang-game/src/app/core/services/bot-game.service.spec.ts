import { TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { BotGameService } from './bot-game.service';
import { BotSessionService } from './bot-session.service';
import { GameStateService } from '../../pages/game/game-state.service';
import { BotDifficulty } from '../models/bot.model';

// ── Stubs ────────────────────────────────────────────────────────────────────

const makeBotSessionStub = (difficulty: BotDifficulty = 'medium', name = 'Pistolero') => ({
  isBotGame: signal(true),
  difficulty: signal(difficulty),
  opponentName: computed(() => name),
  startBotSession: vi.fn(),
  endBotSession: vi.fn(),
});

const makeGameStateStub = (phase = 'idle') => {
  const phaseSignal = signal(phase);
  const myUsernameSignal = signal('jugador');
  return {
    phase: phaseSignal,
    myUsername: myUsernameSignal,
    room: signal(null),
    lastResult: signal(null),
    tapConsumed: signal(false),
    opponentJoined: vi.fn(),
    bothReady: vi.fn(),
    countdownStart: vi.fn(),
    waitingBang: vi.fn(),
    bang: vi.fn(),
    consumeTap: vi.fn(),
    roundResult: vi.fn(),
    opponentWantsRematch: vi.fn(),
    waitingRematch: vi.fn(),
    reset: vi.fn(),
    opponentReady: vi.fn(),
  };
};

// ── Helper setup ─────────────────────────────────────────────────────────────

function setup(
  difficulty: BotDifficulty = 'medium',
  botName = 'Pistolero',
  initialPhase = 'idle'
) {
  const botSessionStub = makeBotSessionStub(difficulty, botName);
  const gameStateStub = makeGameStateStub(initialPhase);

  TestBed.configureTestingModule({
    providers: [
      BotGameService,
      { provide: BotSessionService, useValue: botSessionStub },
      { provide: GameStateService, useValue: gameStateStub },
    ],
  });

  const service = TestBed.inject(BotGameService);
  return { service, botSession: botSessionStub, gameState: gameStateStub };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BotGameService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── 4.1 Esqueleto y reset ───────────────────────────────────────────────────

  describe('4.1 reset()', () => {
    it('existe el método reset() y no lanza error al llamarlo sin timers activos', () => {
      const { service } = setup();
      expect(() => service.reset()).not.toThrow();
    });

    it('reset() cancela todos los timers activos y no lanza error', () => {
      const { service } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0);

      service.playerReady();
      expect(() => service.reset()).not.toThrow();
    });

    it('reset() es idempotente: se puede llamar múltiples veces sin error', () => {
      const { service } = setup();
      service.reset();
      service.reset();
      service.reset();
      // Sin error
    });
  });

  // ── 4.2 startGame() ─────────────────────────────────────────────────────────

  describe('4.2 startGame()', () => {
    it('llama gameState.opponentJoined con roomId "bot-room"', () => {
      const { service, gameState } = setup();
      service.startGame();
      expect(gameState.opponentJoined).toHaveBeenCalledWith(
        expect.objectContaining({ roomId: 'bot-room' })
      );
    });

    it('llama gameState.opponentJoined con opponentUsername del bot', () => {
      const { service, gameState } = setup('medium', 'Pistolero');
      service.startGame();
      expect(gameState.opponentJoined).toHaveBeenCalledWith(
        expect.objectContaining({ opponentUsername: 'Pistolero' })
      );
    });

    it('llama gameState.opponentJoined con myUsername del gameState', () => {
      const { service, gameState } = setup();
      gameState.myUsername.set('alice');
      service.startGame();
      expect(gameState.opponentJoined).toHaveBeenCalledWith(
        expect.objectContaining({ myUsername: 'alice' })
      );
    });

    it('el nombre del bot varía según dificultad easy', () => {
      const { service, gameState } = setup('easy', 'Disparo Fácil');
      service.startGame();
      expect(gameState.opponentJoined).toHaveBeenCalledWith(
        expect.objectContaining({ opponentUsername: 'Disparo Fácil' })
      );
    });

    it('el nombre del bot varía según dificultad hard', () => {
      const { service, gameState } = setup('hard', 'El Rápido');
      service.startGame();
      expect(gameState.opponentJoined).toHaveBeenCalledWith(
        expect.objectContaining({ opponentUsername: 'El Rápido' })
      );
    });
  });

  // ── 4.3 playerReady() — delay ready ─────────────────────────────────────────

  describe('4.3 playerReady() — delay ready y countdown', () => {
    it('no llama bothReady() inmediatamente', () => {
      const { service, gameState } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      expect(gameState.bothReady).not.toHaveBeenCalled();
    });

    it('llama bothReady() después del delay (min: 300ms con random=0)', () => {
      const { service, gameState } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300);
      expect(gameState.bothReady).toHaveBeenCalledOnce();
    });

    it('llama bothReady() después del delay (máximo: ready delay solo usa 1 llamada a random)', () => {
      const { service, gameState } = setup();
      // Primera llamada a random: ready delay = floor(0.9998 * 500 + 300) = 799ms
      // Resto de llamadas no importan para este test
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.9998) // ready delay → 799ms
        .mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(798);
      expect(gameState.bothReady).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(gameState.bothReady).toHaveBeenCalledOnce();
    });

    it('llama countdownStart() 1000ms después de bothReady', () => {
      const { service, gameState } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300); // bothReady
      expect(gameState.countdownStart).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1000);
      expect(gameState.countdownStart).toHaveBeenCalledOnce();
    });

    it('el delay de ready está en el rango 300–800ms con random=0.5', () => {
      const { service, gameState } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      service.playerReady();
      // 300 + 0.5 * 500 = 550ms
      vi.advanceTimersByTime(549);
      expect(gameState.bothReady).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(gameState.bothReady).toHaveBeenCalledOnce();
    });
  });

  // ── 4.4 Fase countdown → waiting-bang ───────────────────────────────────────

  describe('4.4 countdown → waiting-bang', () => {
    it('llama waitingBang() 2500ms después de countdownStart', () => {
      const { service, gameState } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000); // ready + countdownStart
      expect(gameState.waitingBang).not.toHaveBeenCalled();
      vi.advanceTimersByTime(2500);
      expect(gameState.waitingBang).toHaveBeenCalledOnce();
    });

    it('la secuencia completa ready→bothReady→countdown→waitingBang funciona', () => {
      const { service, gameState } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500);
      expect(gameState.bothReady).toHaveBeenCalledOnce();
      expect(gameState.countdownStart).toHaveBeenCalledOnce();
      expect(gameState.waitingBang).toHaveBeenCalledOnce();
    });
  });

  // ── 4.5 waiting-bang → bang-active ──────────────────────────────────────────

  describe('4.5 waiting-bang → bang-active', () => {
    it('llama bang() después de un delay aleatorio entre 1500 y 4000ms', () => {
      const { service, gameState } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500); // hasta waiting-bang
      expect(gameState.bang).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1500); // min delay con random=0
      expect(gameState.bang).toHaveBeenCalledOnce();
    });

    it('el delay bang es 1500ms con random=0', () => {
      const { service, gameState } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 1499);
      expect(gameState.bang).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(gameState.bang).toHaveBeenCalledOnce();
    });

    it('el delay bang es ~4000ms con random~=1 para la llamada de bang', () => {
      const { service, gameState } = setup();
      // Llamadas a random en orden:
      // 1: ready delay → usamos 0 para que sea 300ms
      // 2: bang delay → usamos 0.9998 → floor(0.9998*2500+1500) = floor(2499.5+1500) = floor(3999.5) = 3999ms
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)      // ready delay = 300ms
        .mockReturnValueOnce(0.9998) // bang delay = 3999ms
        .mockReturnValue(0);         // resto
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 3998);
      expect(gameState.bang).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(gameState.bang).toHaveBeenCalledOnce();
    });

    it('llama bang() con Math.random()=0.5 → delay bang 2750ms', () => {
      const { service, gameState } = setup();
      // Llamadas a random en orden:
      // 1: ready delay → 0 → 300ms
      // 2: bang delay → 0.5 → floor(0.5*2500+1500) = floor(1250+1500) = 2750ms
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)   // ready delay = 300ms
        .mockReturnValueOnce(0.5) // bang delay = 2750ms
        .mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 2749);
      expect(gameState.bang).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(gameState.bang).toHaveBeenCalledOnce();
    });
  });

  // ── 4.6 scheduleBotTap() ────────────────────────────────────────────────────

  describe('4.6 scheduleBotTap() — bot gana si jugador no reacciona', () => {
    function advanceToWaitingBang(service: BotGameService) {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500); // hasta waiting-bang
    }

    it('el timer del bot expira y llama roundResult con winnerId = bot (medium)', () => {
      const { service, gameState } = setup('medium', 'Pistolero');
      const mockPhase = signal('bang-active');
      gameState.phase = mockPhase;

      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 1500); // bang emitido

      vi.advanceTimersByTime(300); // min medium = 300ms con random=0
      expect(gameState.roundResult).toHaveBeenCalledWith(
        expect.objectContaining({ winnerId: 'Pistolero' })
      );
    });

    it('el timer del bot no expira si fase no es bang-active', () => {
      const { service, gameState } = setup('medium', 'Pistolero');
      const mockPhase = signal('result'); // ya en result
      gameState.phase = mockPhase;

      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 1500 + 300);
      expect(gameState.roundResult).not.toHaveBeenCalled();
    });

    it('reacción del bot para easy con random=0 es 600ms', () => {
      const { service, gameState } = setup('easy', 'Disparo Fácil');
      const mockPhase = signal('bang-active');
      gameState.phase = mockPhase;

      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 1500); // bang
      vi.advanceTimersByTime(599);
      expect(gameState.roundResult).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(gameState.roundResult).toHaveBeenCalledWith(
        expect.objectContaining({ winnerId: 'Disparo Fácil' })
      );
    });

    it('reacción del bot para hard con random=0 es 150ms', () => {
      const { service, gameState } = setup('hard', 'El Rápido');
      const mockPhase = signal('bang-active');
      gameState.phase = mockPhase;

      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 1500); // bang
      vi.advanceTimersByTime(149);
      expect(gameState.roundResult).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(gameState.roundResult).toHaveBeenCalledWith(
        expect.objectContaining({ winnerId: 'El Rápido' })
      );
    });

    it('reacción del bot para medium con random=0.5 es 450ms', () => {
      const { service, gameState } = setup('medium', 'Pistolero');
      const mockPhase = signal('bang-active');
      gameState.phase = mockPhase;

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      service.playerReady();
      // bang delay: 1500 + floor(0.5*2500) = 2750 ... but random is mocked for all calls
      // ready delay = 300 + floor(0.5*500) = 550
      // bot reaction = 300 + floor(0.5*300) = 450
      vi.advanceTimersByTime(550 + 1000 + 2500 + 2750); // hasta bang
      vi.advanceTimersByTime(449);
      expect(gameState.roundResult).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(gameState.roundResult).toHaveBeenCalledWith(
        expect.objectContaining({ winnerId: 'Pistolero' })
      );
    });
  });

  // ── 4.7 playerTapped() — tap válido ─────────────────────────────────────────

  describe('4.7 playerTapped() — tap válido durante bang-active', () => {
    it('jugador gana si reaccionó antes que el bot', () => {
      const { service, gameState } = setup('medium', 'Pistolero');
      const mockPhase = signal('bang-active');
      gameState.phase = mockPhase;

      vi.spyOn(Math, 'random').mockReturnValue(0); // botReactionMs = 300ms
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // _bangTimestamp
        .mockReturnValueOnce(1100); // playerTapped → 100ms

      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 1500); // llega bang

      service.playerTapped();

      expect(gameState.consumeTap).toHaveBeenCalledOnce();
      expect(gameState.roundResult).toHaveBeenCalledWith(
        expect.objectContaining({
          winnerId: 'jugador',
          loserReactionMs: 300,
        })
      );
    });

    it('bot gana si el jugador reaccionó tarde', () => {
      const { service, gameState } = setup('medium', 'Pistolero');
      const mockPhase = signal('bang-active');
      gameState.phase = mockPhase;

      vi.spyOn(Math, 'random').mockReturnValue(0); // botReactionMs = 300ms
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // _bangTimestamp
        .mockReturnValueOnce(1400); // playerTapped → 400ms (> 300ms del bot)

      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 1500); // bang emitido

      service.playerTapped();

      expect(gameState.consumeTap).toHaveBeenCalledOnce();
      expect(gameState.roundResult).toHaveBeenCalledWith(
        expect.objectContaining({
          winnerId: 'Pistolero',
          winnerReactionMs: 300,
          loserReactionMs: 400,
        })
      );
    });

    it('cancela el timer del bot al hacer tap válido', () => {
      const { service, gameState } = setup('medium', 'Pistolero');
      const mockPhase = signal('bang-active');
      gameState.phase = mockPhase;

      vi.spyOn(Math, 'random').mockReturnValue(0);
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100);

      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 1500);

      service.playerTapped();
      const callCount = (gameState.roundResult as ReturnType<typeof vi.fn>).mock.calls.length;

      // Avanzar el tiempo que tardaría el bot — no debe llamar roundResult de nuevo
      vi.advanceTimersByTime(300);
      expect((gameState.roundResult as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
    });

    it('incluye winnerReactionMs y loserReactionMs correctos cuando jugador gana', () => {
      const { service, gameState } = setup('medium', 'Pistolero');
      const mockPhase = signal('bang-active');
      gameState.phase = mockPhase;

      vi.spyOn(Math, 'random').mockReturnValue(0); // bot: 300ms
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(2200); // 200ms

      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 1500);
      service.playerTapped();

      expect(gameState.roundResult).toHaveBeenCalledWith({
        winnerId: 'jugador',
        loserId: 'Pistolero',
        winnerReactionMs: 200,
        loserReactionMs: 300,
        isFalseStart: false,
      });
    });
  });

  // ── 4.8 playerTapped() — false start ────────────────────────────────────────

  describe('4.8 playerTapped() — false start durante waiting-bang', () => {
    it('detecta false start cuando fase es waiting-bang', () => {
      const { service, gameState } = setup();
      const mockPhase = signal('waiting-bang');
      gameState.phase = mockPhase;

      service.playerTapped();

      expect(gameState.consumeTap).toHaveBeenCalledOnce();
      expect(gameState.roundResult).toHaveBeenCalledWith(
        expect.objectContaining({
          isFalseStart: true,
          winnerId: 'Pistolero',
          loserId: 'jugador',
        })
      );
    });

    it('false start cancela el bangDelayId', () => {
      const { service, gameState } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500); // en waiting-bang

      const mockPhase = signal('waiting-bang');
      gameState.phase = mockPhase;

      service.playerTapped();

      // Si el timer del bang no fue cancelado, bang() se llamaría después
      vi.advanceTimersByTime(1500);
      expect(gameState.bang).not.toHaveBeenCalled();
    });

    it('false start no llama roundResult con isFalseStart=false', () => {
      const { service, gameState } = setup();
      const mockPhase = signal('waiting-bang');
      gameState.phase = mockPhase;

      service.playerTapped();

      const calls = (gameState.roundResult as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0][0].isFalseStart).toBe(true);
    });

    it('fase distinta de waiting-bang o bang-active no produce resultado', () => {
      const { service, gameState } = setup();
      const mockPhase = signal('countdown');
      gameState.phase = mockPhase;

      service.playerTapped();

      expect(gameState.roundResult).not.toHaveBeenCalled();
    });
  });

  // ── 4.9 rematch() ───────────────────────────────────────────────────────────

  describe('4.9 rematch()', () => {
    it('llama gameState.opponentWantsRematch()', () => {
      const { service, gameState } = setup();
      service.rematch();
      expect(gameState.opponentWantsRematch).toHaveBeenCalledOnce();
    });

    it('re-invoca startGame() llamando opponentJoined de nuevo', () => {
      const { service, gameState } = setup();
      service.rematch();
      expect(gameState.opponentJoined).toHaveBeenCalledWith(
        expect.objectContaining({ roomId: 'bot-room' })
      );
    });

    it('cancela timers activos antes de reiniciar', () => {
      const { service, gameState } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();

      service.rematch();

      // Si timers no se cancelaron, bothReady se llamaría en el siguiente tick
      vi.advanceTimersByTime(800 + 1000 + 2500 + 4000 + 1200);
      // Solo debe tener 1 llamada de opponentJoined (del startGame en rematch)
      expect(gameState.opponentJoined).toHaveBeenCalledTimes(1);
    });

    it('no llama gameState.reset()', () => {
      const { service, gameState } = setup();
      service.rematch();
      expect(gameState.reset).not.toHaveBeenCalled();
    });

    it('no modifica BotSessionService', () => {
      const { service, botSession } = setup();
      service.rematch();
      expect(botSession.endBotSession).not.toHaveBeenCalled();
      expect(botSession.startBotSession).not.toHaveBeenCalled();
    });
  });

  // ── 4.10 abandon() ──────────────────────────────────────────────────────────

  describe('4.10 abandon()', () => {
    it('llama gameState.reset()', () => {
      const { service, gameState } = setup();
      service.abandon();
      expect(gameState.reset).toHaveBeenCalledOnce();
    });

    it('cancela todos los timers activos', () => {
      const { service, gameState } = setup();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.playerReady();

      service.abandon();

      // Avanzar tiempo máximo — no deben quedar timers que llamen métodos
      vi.advanceTimersByTime(800 + 1000 + 2500 + 4000 + 1200);
      expect(gameState.bothReady).not.toHaveBeenCalled();
      expect(gameState.countdownStart).not.toHaveBeenCalled();
      expect(gameState.bang).not.toHaveBeenCalled();
    });

    it('no llama a opponentJoined ni opponentWantsRematch', () => {
      const { service, gameState } = setup();
      service.abandon();
      expect(gameState.opponentJoined).not.toHaveBeenCalled();
      expect(gameState.opponentWantsRematch).not.toHaveBeenCalled();
    });
  });

  // ── 4.4 bot false start — dificultad hard ────────────────────────────────────

  describe('false start del bot (dificultad hard)', () => {
    it('el bot comete false start cuando random < 0.05 en hard', () => {
      // Fase waiting-bang para que el timer de false start la encuentre activa
      const { service, gameState } = setup('hard', 'El Rápido', 'waiting-bang');

      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)    // ready delay → 300ms
        .mockReturnValueOnce(0.01) // false start check → 0.01 < 0.05 → dispara
        .mockReturnValueOnce(0)    // false start delay → floor(0*1500+500) = 500ms
        .mockReturnValue(0);       // bang delay y resto

      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500); // hasta _scheduleBang

      vi.advanceTimersByTime(500); // dispara el false start del bot

      expect(gameState.roundResult).toHaveBeenCalledWith(
        expect.objectContaining({
          isFalseStart: true,
          winnerId: 'jugador', // jugador gana cuando el bot se adelanta
          loserId: 'El Rápido',
        })
      );
    });

    it('el false start del bot cancela el timer del bang', () => {
      const { service, gameState } = setup('hard', 'El Rápido', 'waiting-bang');

      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)    // ready delay → 300ms
        .mockReturnValueOnce(0.01) // false start check → dispara
        .mockReturnValueOnce(0)    // false start delay → 500ms
        .mockReturnValue(0);       // bang delay → 1500ms

      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 500); // dispara false start

      const callCount = (gameState.roundResult as ReturnType<typeof vi.fn>).mock.calls.length;

      vi.advanceTimersByTime(1500); // si bang no fue cancelado, dispararía
      expect((gameState.roundResult as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
      expect(gameState.bang).not.toHaveBeenCalled();
    });

    it('el bot NO comete false start cuando random >= 0.05 en hard', () => {
      const { service, gameState } = setup('hard', 'El Rápido', 'waiting-bang');

      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)    // ready delay → 300ms
        .mockReturnValueOnce(0.1)  // false start check → 0.1 >= 0.05 → no dispara
        .mockReturnValue(0);       // bang delay y resto

      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 499); // justo antes de 500ms

      expect(gameState.roundResult).not.toHaveBeenCalled();
    });

    it('el bot NO comete false start con dificultad easy', () => {
      const { service, gameState } = setup('easy', 'Disparo Fácil', 'waiting-bang');

      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)    // ready delay
        .mockReturnValueOnce(0.01) // si llegara al check de false start, dispararía
        .mockReturnValue(0);

      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 2000); // mucho tiempo en waiting-bang

      expect(gameState.roundResult).not.toHaveBeenCalled();
    });

    it('el bot NO comete false start con dificultad medium', () => {
      const { service, gameState } = setup('medium', 'Pistolero', 'waiting-bang');

      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.01)
        .mockReturnValue(0);

      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500 + 2000);

      expect(gameState.roundResult).not.toHaveBeenCalled();
    });

    it('reset() cancela el timer de false start del bot', () => {
      const { service, gameState } = setup('hard', 'El Rápido', 'waiting-bang');

      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.01) // false start check
        .mockReturnValueOnce(0)    // false start delay → 500ms
        .mockReturnValue(0);

      service.playerReady();
      vi.advanceTimersByTime(300 + 1000 + 2500); // _scheduleBang llamado

      service.reset(); // cancela todos los timers

      vi.advanceTimersByTime(2000); // el false start debería haber disparado, pero fue cancelado
      expect(gameState.roundResult).not.toHaveBeenCalled();
    });
  });
});
