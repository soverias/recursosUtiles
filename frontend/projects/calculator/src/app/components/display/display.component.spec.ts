import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { DisplayComponent } from './display.component';
import { EvalResult } from '../../core/models/expression.model';

function mkResult(value: number, symbol?: string): EvalResult {
  const unit = symbol ? { symbol, name: symbol, category: 'data' as const, toBase: (v: number) => v, fromBase: (v: number) => v } : null;
  return { value, unit, formatted: symbol ? `${value} ${symbol}` : `${value}` };
}

describe('DisplayComponent', () => {
  async function setup(expression: string, result: EvalResult | null = null, error: string | null = null) {
    @Component({
      template: `<app-display [expression]="expression" [result]="result" [error]="error" />`,
      imports: [DisplayComponent],
    })
    class Host {
      expression = expression;
      result = result;
      error = error;
    }
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('DISP-01: shows the current expression', async () => {
    const { el } = await setup('2 GB + 500');
    expect(el.textContent).toContain('2 GB + 500');
  });

  it('DISP-02: shows result value with unit', async () => {
    const { el } = await setup('2 GB', mkResult(2048, 'MB'));
    expect(el.textContent).toContain('2048');
    expect(el.textContent).toContain('MB');
  });

  it('DISP-03: shows numeric result without unit', async () => {
    const { el } = await setup('3 + 4', mkResult(7));
    expect(el.textContent).toContain('7');
  });

  it('DISP-04: shows error message when error is set', async () => {
    const { el } = await setup('5 / 0', null, 'División por cero');
    expect(el.textContent).toContain('División por cero');
  });

  it('DISP-05: error displayed even if result also provided', async () => {
    const { el } = await setup('x', mkResult(0), 'Error de sintaxis');
    expect(el.textContent).toContain('Error de sintaxis');
  });

  it('DISP-06: placeholder shown when expression is empty', async () => {
    const { el } = await setup('');
    const text = el.textContent ?? '';
    expect(text.trim().length).toBeGreaterThan(0);
  });
});
