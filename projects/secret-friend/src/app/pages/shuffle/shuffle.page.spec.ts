import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ShufflePage } from './shuffle.page';
import { GameService } from '../../services/game.service';

describe('ShufflePage', () => {
  let fixture: ComponentFixture<ShufflePage>;
  let game: GameService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ShufflePage],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(ShufflePage);
    game = TestBed.inject(GameService);
    router = TestBed.inject(Router);
    game.addParticipant('Alice');
    game.addParticipant('Bob');
    game.addParticipant('Carlos');
    fixture.detectChanges();
  });

  it('shows participant count', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('3');
  });

  it('navigates to /reveal on successful shuffle', () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const btn = fixture.nativeElement.querySelector('[data-shuffle]');
    btn.click();
    expect(spy).toHaveBeenCalledWith(['/reveal']);
  });

  it('shows error message when shuffle is infeasible', () => {
    vi.spyOn(game, 'shuffle').mockReturnValue('infeasible');
    const btn = fixture.nativeElement.querySelector('[data-shuffle]');
    btn.click();
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('No es posible');
  });

  it('navigates to /setup when Volver clicked', () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const btn = fixture.nativeElement.querySelector('[data-back]');
    btn.click();
    expect(spy).toHaveBeenCalledWith(['/setup']);
  });
});
