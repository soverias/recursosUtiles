import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CalculatorService } from './calculator.service';
import { HistoryService } from './history.service';

describe('CalculatorService', () => {
  let service: CalculatorService;
  let historyService: HistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculatorService);
    historyService = TestBed.inject(HistoryService);
  });

  it('CALC-01: expression starts empty', () => {
    expect(service.expression()).toBe('');
  });

  it('CALC-02: appendToExpression appends a digit', () => {
    service.appendToExpression('5');
    expect(service.expression()).toBe('5');
  });

  it('CALC-03: appendToExpression appends operator', () => {
    service.appendToExpression('5');
    service.appendToExpression('+');
    expect(service.expression()).toBe('5+');
  });

  it('CALC-04: appendToExpression appends unit symbol with space', () => {
    service.appendToExpression('2');
    service.appendToExpression('GB');
    expect(service.expression()).toBe('2 GB');
  });

  it('CALC-05: deleteLast removes the last character', () => {
    service.appendToExpression('1');
    service.appendToExpression('2');
    service.appendToExpression('3');
    service.deleteLast();
    expect(service.expression()).toBe('12');
  });

  it('CALC-06: deleteLast on empty expression does nothing', () => {
    service.deleteLast();
    expect(service.expression()).toBe('');
  });

  it('CALC-07: clearExpression resets to empty', () => {
    service.appendToExpression('1');
    service.appendToExpression('2');
    service.clearExpression();
    expect(service.expression()).toBe('');
  });

  it('CALC-08: result computed updates when expression changes', () => {
    service.appendToExpression('3');
    service.appendToExpression('+');
    service.appendToExpression('4');
    expect(service.result()?.value).toBe(7);
  });

  it('CALC-09: error computed is set on invalid expression', () => {
    service.appendToExpression('3');
    service.appendToExpression('/');
    service.appendToExpression('0');
    expect(service.error()).not.toBeNull();
  });

  it('CALC-10: calculate pushes entry to history', () => {
    service.appendToExpression('3');
    service.appendToExpression('+');
    service.appendToExpression('4');
    service.calculate();
    expect(historyService.entries()).toHaveLength(1);
    expect(historyService.entries()[0].expression).toBe('3+4');
  });

  it('CALC-11: calculate does nothing on empty expression', () => {
    service.calculate();
    expect(historyService.entries()).toHaveLength(0);
  });

  it('CALC-12: setCategory changes activeCategory', () => {
    service.setCategory('data');
    expect(service.activeCategory()).toBe('data');
  });

  it('CALC-13: setCategory resets outputUnit', () => {
    service.setCategory('data');
    const mb = service.categories.find(c => c.category === 'data')!.units.find(u => u.symbol === 'MB')!;
    service.setOutputUnit(mb);
    service.setCategory('weight');
    expect(service.outputUnit()).toBeNull();
  });

  it('CALC-14: setOutputUnit changes outputUnit signal', () => {
    service.setCategory('data');
    const mb = service.categories.find(c => c.category === 'data')!.units.find(u => u.symbol === 'MB')!;
    service.setOutputUnit(mb);
    expect(service.outputUnit()?.symbol).toBe('MB');
  });

  it('CALC-15: loadExpression replaces the current expression', () => {
    service.appendToExpression('1');
    service.loadExpression('9 + 9');
    expect(service.expression()).toBe('9 + 9');
  });

  it('CALC-16: quickUnits returns units for active category', () => {
    service.setCategory('data');
    const symbols = service.quickUnits().map(u => u.symbol);
    expect(symbols).toContain('GB');
    expect(symbols).toContain('MB');
  });

  it('CALC-17: quickUnits is empty for numeric category', () => {
    service.setCategory('numeric');
    expect(service.quickUnits()).toHaveLength(0);
  });
});
