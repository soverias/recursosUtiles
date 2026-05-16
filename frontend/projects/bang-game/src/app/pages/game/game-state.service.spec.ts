import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';
import { RoomInfo, RoundResult } from '../../core/models/room.model';

const roomInfo: RoomInfo = { roomId: 'r1', opponentUsername: 'Bob', myUsername: 'Me' };
const result: RoundResult = {
  winnerId: 'u1', loserId: 'u2',
  winnerReactionMs: 220, loserReactionMs: 380,
  isFalseStart: false,
};

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GameStateService] });
    service = TestBed.inject(GameStateService);
  });

  // --- estado inicial ---

  it('phase starts as idle', () => {
    expect(service.phase()).toBe('idle');
  });

  it('tapConsumed starts as false', () => {
    expect(service.tapConsumed()).toBe(false);
  });

  // --- transiciones desde idle ---

  it('opponentJoined transitions idle → waiting-opponent and stores room info', () => {
    service.opponentJoined(roomInfo);
    expect(service.phase()).toBe('waiting-opponent');
    expect(service.room()?.opponentUsername).toBe('Bob');
  });

  // --- both-ready ---

  it('bothReady transitions waiting-opponent → both-ready', () => {
    service.opponentJoined(roomInfo);
    service.bothReady();
    expect(service.phase()).toBe('both-ready');
  });

  // --- countdown ---

  it('countdownStart transitions both-ready → countdown', () => {
    vi.useFakeTimers();
    service.opponentJoined(roomInfo);
    service.bothReady();
    service.countdownStart();
    expect(service.phase()).toBe('countdown');
    vi.useRealTimers();
  });

  it('countdownStart sets initial label to first step', () => {
    vi.useFakeTimers();
    service.countdownStart();
    expect(service.countdownLabel()).toBe('Preparados');
    vi.useRealTimers();
  });

  it('countdownLabel advances after 1 second', async () => {
    vi.useFakeTimers();
    service.countdownStart();
    await vi.advanceTimersByTimeAsync(1000);
    expect(service.countdownLabel()).toBe('Listos');
    vi.useRealTimers();
  });

  it('countdownLabel keeps last step after interval ends', async () => {
    vi.useFakeTimers();
    service.countdownStart();
    await vi.advanceTimersByTimeAsync(2000); // past all steps
    expect(service.countdownLabel()).toBe('Listos');
    vi.useRealTimers();
  });

  it('waitingBang clears countdownLabel', () => {
    vi.useFakeTimers();
    service.countdownStart();
    service.waitingBang();
    expect(service.countdownLabel()).toBe('');
    vi.useRealTimers();
  });

  // --- waiting-bang ---

  it('waitingBang transitions countdown → waiting-bang', () => {
    service.opponentJoined(roomInfo);
    service.bothReady();
    service.countdownStart();
    service.waitingBang();
    expect(service.phase()).toBe('waiting-bang');
  });

  // --- bang-active ---

  it('bang transitions waiting-bang → bang-active and resets tapConsumed', () => {
    service.opponentJoined(roomInfo);
    service.bothReady();
    service.countdownStart();
    service.waitingBang();
    service.consumeTap(); // simulate previous tap
    service.bang();
    expect(service.phase()).toBe('bang-active');
    expect(service.tapConsumed()).toBe(false);
  });

  // --- tapConsumed ---

  it('consumeTap sets tapConsumed to true', () => {
    service.consumeTap();
    expect(service.tapConsumed()).toBe(true);
  });

  // --- result ---

  it('roundResult transitions bang-active → result and stores round data', () => {
    service.opponentJoined(roomInfo);
    service.bothReady();
    service.countdownStart();
    service.waitingBang();
    service.bang();
    service.roundResult(result);
    expect(service.phase()).toBe('result');
    expect(service.lastResult()?.winnerReactionMs).toBe(220);
  });

  // --- reset ---

  it('reset returns to idle and clears state', () => {
    service.opponentJoined(roomInfo);
    service.roundResult(result);
    service.reset();
    expect(service.phase()).toBe('idle');
    expect(service.room()).toBeNull();
    expect(service.lastResult()).toBeNull();
    expect(service.tapConsumed()).toBe(false);
  });

  // TRIANGULATE: private room has code

  it('opponentJoined stores room code for private rooms', () => {
    const privateRoom: RoomInfo = { roomId: 'r2', code: 'ABC123', opponentUsername: 'Ana', myUsername: 'Me' };
    service.opponentJoined(privateRoom);
    expect(service.room()?.code).toBe('ABC123');
  });

  // --- waiting-rematch ---

  it('waitingRematch transitions result → waiting-rematch and clears lastResult', () => {
    service.roundResult(result);
    service.waitingRematch();
    expect(service.phase()).toBe('waiting-rematch');
    expect(service.lastResult()).toBeNull();
  });

  // --- opponentIsReady ---

  it('opponentIsReady starts as false', () => {
    expect(service.opponentIsReady()).toBe(false);
  });

  it('opponentReady sets opponentIsReady to true', () => {
    service.opponentReady();
    expect(service.opponentIsReady()).toBe(true);
  });

  it('bothReady resets opponentIsReady to false', () => {
    service.opponentReady();
    service.bothReady();
    expect(service.opponentIsReady()).toBe(false);
  });

  it('reset resets opponentIsReady to false', () => {
    service.opponentReady();
    service.reset();
    expect(service.opponentIsReady()).toBe(false);
  });

  // --- opponentWantsRepeat ---

  it('opponentWantsRepeat starts as false', () => {
    expect(service.opponentWantsRepeat()).toBe(false);
  });

  it('opponentWantsRematch sets opponentWantsRepeat to true', () => {
    service.opponentWantsRematch();
    expect(service.opponentWantsRepeat()).toBe(true);
  });

  it('waitingRematch resets opponentWantsRepeat to false', () => {
    service.opponentWantsRematch();
    service.waitingRematch();
    expect(service.opponentWantsRepeat()).toBe(false);
  });

  it('reset resets opponentWantsRepeat to false', () => {
    service.opponentWantsRematch();
    service.reset();
    expect(service.opponentWantsRepeat()).toBe(false);
  });

  // TRIANGULATE: false start result

  it('roundResult stores isFalseStart correctly', () => {
    service.opponentJoined(roomInfo);
    service.bothReady();
    service.countdownStart();
    service.waitingBang();
    service.bang();
    const falseStart: RoundResult = { ...result, isFalseStart: true };
    service.roundResult(falseStart);
    expect(service.lastResult()?.isFalseStart).toBe(true);
  });
});
