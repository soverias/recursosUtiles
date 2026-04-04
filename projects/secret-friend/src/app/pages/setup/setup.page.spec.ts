import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SetupPage } from './setup.page';
import { GameService } from '../../services/game.service';

describe('SetupPage', () => {
  let fixture: ComponentFixture<SetupPage>;
  let game: GameService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [SetupPage],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(SetupPage);
    game = TestBed.inject(GameService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('renders ParticipantListComponent', () => {
    expect(fixture.nativeElement.querySelector('app-participant-list')).not.toBeNull();
  });

  it('renders ExclusionListComponent', () => {
    expect(fixture.nativeElement.querySelector('app-exclusion-list')).not.toBeNull();
  });

  it('"Ir a sortear" button is disabled when participants < 3', () => {
    game.addParticipant('Alice');
    game.addParticipant('Bob');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('[data-goto-shuffle]');
    expect(btn.disabled).toBe(true);
  });

  it('"Ir a sortear" button is enabled when participants >= 3', () => {
    game.addParticipant('Alice');
    game.addParticipant('Bob');
    game.addParticipant('Carlos');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('[data-goto-shuffle]');
    expect(btn.disabled).toBe(false);
  });

  it('navigates to /shuffle when "Ir a sortear" clicked with >= 3 participants', async () => {
    game.addParticipant('Alice');
    game.addParticipant('Bob');
    game.addParticipant('Carlos');
    fixture.detectChanges();
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const btn = fixture.nativeElement.querySelector('[data-goto-shuffle]');
    btn.click();
    expect(spy).toHaveBeenCalledWith(['/shuffle']);
  });
});
