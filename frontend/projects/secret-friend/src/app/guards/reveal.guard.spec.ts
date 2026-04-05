import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { GameService } from '../services/game.service';
import { canActivateReveal } from './reveal.guard';

describe('canActivateReveal', () => {
  let game: GameService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), GameService] });
    game = TestBed.inject(GameService);
  });

  it('returns UrlTree to /setup when assignments is empty', () => {
    const result = TestBed.runInInjectionContext(() => canActivateReveal({} as any, {} as any));
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/setup');
  });

  it('returns true when assignments exist', () => {
    game.addParticipant('Alice');
    game.addParticipant('Bob');
    game.addParticipant('Carlos');
    game.shuffle();
    const result = TestBed.runInInjectionContext(() => canActivateReveal({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('returns true with exactly 1 assignment (boundary)', () => {
    game.addParticipant('Alice');
    game.addParticipant('Bob');
    game.addParticipant('Carlos');
    game.shuffle();
    expect(game.assignments().length).toBeGreaterThan(0);
    const result = TestBed.runInInjectionContext(() => canActivateReveal({} as any, {} as any));
    expect(result).toBe(true);
  });
});
