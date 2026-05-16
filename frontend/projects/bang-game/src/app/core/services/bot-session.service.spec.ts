import { TestBed } from '@angular/core/testing';
import { BotSessionService } from './bot-session.service';

describe('BotSessionService', () => {
  let service: BotSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BotSessionService] });
    service = TestBed.inject(BotSessionService);
  });

  // --- estado inicial ---

  it('isBotGame es false por defecto', () => {
    expect(service.isBotGame()).toBe(false);
  });

  it('difficulty es "medium" por defecto', () => {
    expect(service.difficulty()).toBe('medium');
  });

  it('opponentName es "Pistolero" con difficulty medium por defecto', () => {
    expect(service.opponentName()).toBe('Pistolero');
  });

  // --- startBotSession ---

  it('startBotSession activa isBotGame', () => {
    service.startBotSession('easy');
    expect(service.isBotGame()).toBe(true);
  });

  it('startBotSession almacena la difficulty indicada', () => {
    service.startBotSession('hard');
    expect(service.difficulty()).toBe('hard');
  });

  it('opponentName devuelve "Disparo Fácil" cuando difficulty es easy', () => {
    service.startBotSession('easy');
    expect(service.opponentName()).toBe('Disparo Fácil');
  });

  it('opponentName devuelve "El Rápido" cuando difficulty es hard', () => {
    service.startBotSession('hard');
    expect(service.opponentName()).toBe('El Rápido');
  });

  // --- endBotSession ---

  it('endBotSession desactiva isBotGame', () => {
    service.startBotSession('easy');
    service.endBotSession();
    expect(service.isBotGame()).toBe(false);
  });

  it('endBotSession resetea difficulty a "medium"', () => {
    service.startBotSession('hard');
    service.endBotSession();
    expect(service.difficulty()).toBe('medium');
  });

  it('endBotSession restaura opponentName a "Pistolero"', () => {
    service.startBotSession('easy');
    service.endBotSession();
    expect(service.opponentName()).toBe('Pistolero');
  });
});
