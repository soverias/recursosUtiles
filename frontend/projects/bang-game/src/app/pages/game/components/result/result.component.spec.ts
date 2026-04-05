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

  const create = (result: RoundResult, myId: string) => {
    TestBed.configureTestingModule({ imports: [ResultComponent] });
    fixture = TestBed.createComponent(ResultComponent);
    fixture.componentRef.setInput('result', result);
    fixture.componentRef.setInput('myId', myId);
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

  it('shows winner reaction time', () => {
    create(WIN, 'me');
    expect(fixture.nativeElement.textContent).toContain('210');
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
});
