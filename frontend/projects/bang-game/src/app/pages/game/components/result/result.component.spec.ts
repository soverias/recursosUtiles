import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultComponent } from './result.component';
import { RoundResult } from '../../../../core/models/room.model';

const WIN: RoundResult = {
  winnerId: 'me', loserId: 'them',
  winnerReactionMs: 210, loserReactionMs: 380,
  isFalseStart: false,
};
const LOSE: RoundResult = {
  winnerId: 'them', loserId: 'me',
  winnerReactionMs: 195, loserReactionMs: 410,
  isFalseStart: false,
};
const FALSE_START: RoundResult = {
  winnerId: 'them', loserId: 'me',
  winnerReactionMs: 0, loserReactionMs: 0,
  isFalseStart: true,
};

describe('ResultComponent', () => {
  let fixture: ComponentFixture<ResultComponent>;

  const create = (result: RoundResult, myId: string, opponentWantsRepeat = false) => {
    const opponentUsername = result.winnerId === myId ? result.loserId : result.winnerId;
    TestBed.configureTestingModule({ imports: [ResultComponent] });
    fixture = TestBed.createComponent(ResultComponent);
    fixture.componentRef.setInput('result', result);
    fixture.componentRef.setInput('opponentUsername', opponentUsername);
    fixture.componentRef.setInput('opponentWantsRepeat', opponentWantsRepeat);
    fixture.detectChanges();
  };

  it('shows "¡GANASTE!" when current player is winner', () => {
    create(WIN, 'me');
    expect(fixture.nativeElement.querySelector('[data-outcome]').textContent).toContain('GANASTE');
  });

  it('shows "PERDISTE" when current player is loser', () => {
    create(LOSE, 'me');
    expect(fixture.nativeElement.querySelector('[data-outcome]').textContent).toContain('PERDISTE');
  });

  it('shows false start message when isFalseStart is true', () => {
    create(FALSE_START, 'me');
    expect(fixture.nativeElement.querySelector('[data-outcome]').textContent).toContain('Salida en falso');
  });

  it('shows winner reaction time when player wins', () => {
    create(WIN, 'me');
    expect(fixture.nativeElement.textContent).toContain('210');
  });

  it('shows opponent reaction time when player loses', () => {
    create(LOSE, 'me');
    expect(fixture.nativeElement.textContent).toContain('195'); // winnerReactionMs del oponente
  });

  it('shows opponent username next to their reaction time when player loses', () => {
    create(LOSE, 'me');
    const outcome = fixture.nativeElement.querySelector('[data-outcome]');
    expect(outcome.textContent).toContain('them');
    expect(outcome.textContent).toContain('195');
  });

  it('emits repeat when "Repetir" button clicked', () => {
    create(WIN, 'me');
    const spy = vi.fn();
    fixture.componentInstance.repeat.subscribe(spy);
    fixture.nativeElement.querySelector('[data-repeat-btn]').click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('emits playOther when "Jugar con otro" button clicked', () => {
    create(WIN, 'me');
    const spy = vi.fn();
    fixture.componentInstance.playOther.subscribe(spy);
    fixture.nativeElement.querySelector('[data-other-btn]').click();
    expect(spy).toHaveBeenCalledOnce();
  });

  // --- opponentWantsRepeat banner ---

  it('does not show opponent-wants-repeat banner by default', () => {
    create(WIN, 'me');
    expect(fixture.nativeElement.querySelector('[data-opponent-wants-repeat]')).toBeNull();
  });

  it('shows opponent-wants-repeat banner when opponentWantsRepeat is true', () => {
    create(WIN, 'me', true);
    expect(fixture.nativeElement.querySelector('[data-opponent-wants-repeat]')).not.toBeNull();
  });

  it('banner contains informative text about opponent wanting to repeat', () => {
    create(WIN, 'me', true);
    const banner = fixture.nativeElement.querySelector('[data-opponent-wants-repeat]');
    expect(banner.textContent).toContain('oponente');
  });
});
