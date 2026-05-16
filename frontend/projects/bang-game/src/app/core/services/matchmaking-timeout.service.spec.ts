import { TestBed } from '@angular/core/testing';
import { MatchmakingTimeoutService } from './matchmaking-timeout.service';

describe('MatchmakingTimeoutService', () => {
  let service: MatchmakingTimeoutService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [MatchmakingTimeoutService] });
    service = TestBed.inject(MatchmakingTimeoutService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- estado inicial ---

  it('expired es false antes de llamar a start()', () => {
    expect(service.expired()).toBe(false);
  });

  // --- start / expiración ---

  it('expired es false justo antes de que se cumpla el tiempo', () => {
    service.start(30_000);
    vi.advanceTimersByTime(29_999);
    expect(service.expired()).toBe(false);
  });

  it('expired pasa a true exactamente al cumplirse el timeout', () => {
    service.start(30_000);
    vi.advanceTimersByTime(30_000);
    expect(service.expired()).toBe(true);
  });

  it('funciona con duraciones personalizadas', () => {
    service.start(5_000);
    vi.advanceTimersByTime(5_000);
    expect(service.expired()).toBe(true);
  });

  // --- cancel ---

  it('cancel() antes de start() no lanza error', () => {
    expect(() => service.cancel()).not.toThrow();
  });

  it('cancel() impide que expired pase a true', () => {
    service.start(30_000);
    service.cancel();
    vi.advanceTimersByTime(30_000);
    expect(service.expired()).toBe(false);
  });

  it('cancel() resetea expired a false si ya había expirado', () => {
    service.start(1_000);
    vi.advanceTimersByTime(1_000);
    expect(service.expired()).toBe(true);
    service.cancel();
    expect(service.expired()).toBe(false);
  });

  // --- llamada a start() mientras hay timer activo ---

  it('llamar a start() dos veces cancela el timer anterior', () => {
    service.start(30_000);
    vi.advanceTimersByTime(15_000);
    service.start(30_000); // reinicia el timer
    vi.advanceTimersByTime(29_999);
    expect(service.expired()).toBe(false); // el primer timer no debería haber disparado
  });

  it('el segundo start() expira correctamente al cumplirse su propio plazo', () => {
    service.start(30_000);
    vi.advanceTimersByTime(15_000);
    service.start(30_000);
    vi.advanceTimersByTime(30_000);
    expect(service.expired()).toBe(true);
  });
});
