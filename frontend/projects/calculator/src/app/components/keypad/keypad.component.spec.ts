import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { KeypadComponent } from './keypad.component';
import { UnitDefinition } from '../../core/models/unit.model';

function mkUnit(symbol: string): UnitDefinition {
  return { symbol, name: symbol, category: 'data', toBase: v => v, fromBase: v => v };
}

describe('KeypadComponent', () => {
  async function setup(quickUnits: UnitDefinition[] = []) {
    const pressed: string[] = [];

    @Component({
      template: `<app-keypad [quickUnits]="quickUnits" (keyPress)="onKey($event)" />`,
      imports: [KeypadComponent],
    })
    class Host {
      quickUnits = quickUnits;
      onKey(k: string) { pressed.push(k); }
    }

    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, pressed };
  }

  it('KP-01: renders digit buttons 0-9', async () => {
    const { el } = await setup();
    for (let d = 0; d <= 9; d++) {
      const btn = [...el.querySelectorAll('button')].find(b => b.textContent?.trim() === `${d}`);
      expect(btn, `Button ${d} should exist`).not.toBeNull();
    }
  });

  it('KP-02: renders operator buttons', async () => {
    const { el } = await setup();
    const texts = [...el.querySelectorAll('button')].map(b => b.textContent?.trim());
    expect(texts).toContain('+');
    expect(texts).toContain('−');
    expect(texts).toContain('×');
    expect(texts).toContain('÷');
  });

  it('KP-03: renders special buttons C, ⌫, =', async () => {
    const { el } = await setup();
    const texts = [...el.querySelectorAll('button')].map(b => b.textContent?.trim());
    expect(texts).toContain('C');
    expect(texts).toContain('⌫');
    expect(texts).toContain('=');
  });

  it('KP-04: clicking digit emits keyPress', async () => {
    const { el, pressed } = await setup();
    const btn7 = [...el.querySelectorAll('button')].find(b => b.textContent?.trim() === '7') as HTMLButtonElement;
    btn7.click();
    expect(pressed).toContain('7');
  });

  it('KP-05: clicking operator emits keyPress', async () => {
    const { el, pressed } = await setup();
    const btnPlus = [...el.querySelectorAll('button')].find(b => b.textContent?.trim() === '+') as HTMLButtonElement;
    btnPlus.click();
    expect(pressed).toContain('+');
  });

  it('KP-06: clicking C emits "C"', async () => {
    const { el, pressed } = await setup();
    const btnC = [...el.querySelectorAll('button')].find(b => b.textContent?.trim() === 'C') as HTMLButtonElement;
    btnC.click();
    expect(pressed).toContain('C');
  });

  it('KP-07: unit quick buttons shown when quickUnits provided', async () => {
    const { el } = await setup([mkUnit('GB'), mkUnit('MB')]);
    const texts = [...el.querySelectorAll('button')].map(b => b.textContent?.trim());
    expect(texts).toContain('GB');
    expect(texts).toContain('MB');
  });

  it('KP-08: clicking unit button emits unit symbol', async () => {
    const { el, pressed } = await setup([mkUnit('GB')]);
    const btnGB = [...el.querySelectorAll('button')].find(b => b.textContent?.trim() === 'GB') as HTMLButtonElement;
    btnGB.click();
    expect(pressed).toContain('GB');
  });

  it('KP-09: no unit row when quickUnits is empty', async () => {
    const { el } = await setup([]);
    const texts = [...el.querySelectorAll('button')].map(b => b.textContent?.trim());
    expect(texts).not.toContain('GB');
    expect(texts).not.toContain('MB');
  });
});
