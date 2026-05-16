import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { HistoryService } from './core/services/history.service';
import { CalculatorService } from './core/services/calculator.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('APP-01: renders app title in header', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Calculadora');
  });

  it('APP-02: renders all main child components', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-display')).not.toBeNull();
    expect(el.querySelector('app-keypad')).not.toBeNull();
    expect(el.querySelector('app-unit-selector')).not.toBeNull();
    expect(el.querySelector('app-history-panel')).not.toBeNull();
  });

  it('APP-03: pressing digits and equals updates result', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const calc = TestBed.inject(CalculatorService);

    calc.appendToExpression('3');
    calc.appendToExpression('+');
    calc.appendToExpression('4');
    fixture.detectChanges();

    expect(calc.result()?.value).toBe(7);
  });

  it('APP-04: calculate adds entry to history', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const calc = TestBed.inject(CalculatorService);
    const history = TestBed.inject(HistoryService);

    calc.appendToExpression('5');
    calc.appendToExpression('+');
    calc.appendToExpression('5');
    calc.calculate();
    fixture.detectChanges();

    expect(history.entries()).toHaveLength(1);
    expect(history.entries()[0].result.value).toBe(10);
  });
});
