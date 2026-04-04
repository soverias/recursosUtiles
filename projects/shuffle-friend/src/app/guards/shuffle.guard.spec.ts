import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { GameService } from '../services/game.service';
import { canActivateShuffle } from './shuffle.guard';

describe('canActivateShuffle', () => {
  let game: GameService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), GameService] });
    game = TestBed.inject(GameService);
    router = TestBed.inject(Router);
  });

  it('returns true when participants >= 3', () => {
    game.addParticipant('Alice');
    game.addParticipant('Bob');
    game.addParticipant('Carlos');
    const result = TestBed.runInInjectionContext(() => canActivateShuffle({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('returns UrlTree to /setup when participants < 3', () => {
    game.addParticipant('Alice');
    game.addParticipant('Bob');
    const result = TestBed.runInInjectionContext(() => canActivateShuffle({} as any, {} as any));
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/setup');
  });

  it('returns UrlTree when no participants', () => {
    const result = TestBed.runInInjectionContext(() => canActivateShuffle({} as any, {} as any));
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('returns true with exactly 3 participants (boundary)', () => {
    game.addParticipant('A');
    game.addParticipant('B');
    game.addParticipant('C');
    const result = TestBed.runInInjectionContext(() => canActivateShuffle({} as any, {} as any));
    expect(result).toBe(true);
  });
});
