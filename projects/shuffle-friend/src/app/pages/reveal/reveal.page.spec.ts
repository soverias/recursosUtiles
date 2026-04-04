import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RevealPage } from './reveal.page';
import { GameService } from '../../services/game.service';

describe('RevealPage', () => {
  let fixture: ComponentFixture<RevealPage>;
  let game: GameService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [RevealPage],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(RevealPage);
    game = TestBed.inject(GameService);
    router = TestBed.inject(Router);
    game.addParticipant('Alice');
    game.addParticipant('Bob');
    game.addParticipant('Carlos');
    game.shuffle();
    fixture.detectChanges();
  });

  it('shows unrevealed participants as buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('[data-participant-btn]');
    expect(buttons.length).toBe(3);
  });

  it('clicking a participant opens confirm dialog with their name', () => {
    const btn = fixture.nativeElement.querySelector('[data-participant-btn]') as HTMLButtonElement;
    const name = btn.textContent?.trim();
    btn.click();
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain(name);
  });

  it('cancelling confirm dialog closes it without revealing', () => {
    const btn = fixture.nativeElement.querySelector('[data-participant-btn]') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    const cancelBtn = fixture.nativeElement.querySelector('button[data-cancel]');
    cancelBtn.click();
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeNull();
    expect(game.assignments().every(a => !a.revealed)).toBe(true);
  });

  it('confirming shows reveal card', () => {
    const btn = fixture.nativeElement.querySelector('[data-participant-btn]') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    const confirmBtn = fixture.nativeElement.querySelector('button[data-confirm]');
    confirmBtn.click();
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('app-reveal-card');
    expect(card).not.toBeNull();
  });

  it('shows "Todos revelados" and reset button when allRevealed', () => {
    game.assignments().forEach(a => game.revealFor(a.giverId));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Todos revelados');
    const resetBtn = fixture.nativeElement.querySelector('[data-reset]');
    expect(resetBtn).not.toBeNull();
  });

  it('reset button calls game.reset() and navigates to /setup', () => {
    game.assignments().forEach(a => game.revealFor(a.giverId));
    fixture.detectChanges();
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const resetBtn = fixture.nativeElement.querySelector('[data-reset]') as HTMLButtonElement;
    resetBtn.click();
    expect(game.assignments().length).toBe(0);
    expect(spy).toHaveBeenCalledWith(['/setup']);
  });
});
