import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { HistoryPanelComponent } from './history-panel.component';
import { HistoryEntry } from '../../core/models/expression.model';

function makeEntry(id: number, expr: string): HistoryEntry {
  return { id, expression: expr, result: { value: id, unit: null, formatted: `${id}` }, timestamp: Date.now() };
}

describe('HistoryPanelComponent', () => {
  async function setup(entries: HistoryEntry[] = []) {
    const emitted: { selected?: HistoryEntry; cleared?: boolean }[] = [];

    @Component({
      template: `
        <app-history-panel
          [entries]="entries"
          (entrySelected)="emitted.push({ selected: $event })"
          (clearHistory)="emitted.push({ cleared: true })" />
      `,
      imports: [HistoryPanelComponent],
    })
    class Host {
      entries = entries;
      emitted = emitted;
    }

    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, emitted };
  }

  it('HP-01: toggle button shows entry count', async () => {
    const { el } = await setup([makeEntry(1, '1+1'), makeEntry(2, '2+2')]);
    const toggle = el.querySelector('[data-toggle]') as HTMLElement;
    expect(toggle?.textContent).toContain('2');
  });

  it('HP-02: panel starts collapsed — entries not visible', async () => {
    const { el } = await setup([makeEntry(1, '1+1')]);
    expect(el.textContent).not.toContain('1+1');
  });

  it('HP-03: clicking toggle expands panel', async () => {
    const { el, fixture } = await setup([makeEntry(1, '1+1')]);
    const toggle = el.querySelector('[data-toggle]') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('1+1');
  });

  it('HP-04: clicking toggle again collapses panel', async () => {
    const { el, fixture } = await setup([makeEntry(1, '1+1')]);
    const toggle = el.querySelector('[data-toggle]') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    toggle.click();
    fixture.detectChanges();
    expect(el.textContent).not.toContain('1+1');
  });

  it('HP-05: clicking an entry emits entrySelected', async () => {
    const entry = makeEntry(1, '3+4');
    const { el, fixture, emitted } = await setup([entry]);
    const toggle = el.querySelector('[data-toggle]') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    const entryEl = el.querySelector('[data-entry]') as HTMLButtonElement;
    entryEl.click();
    expect(emitted.some(e => e.selected?.id === 1)).toBe(true);
  });

  it('HP-06: clear button emits clearHistory', async () => {
    const { el, fixture, emitted } = await setup([makeEntry(1, '1+1')]);
    const toggle = el.querySelector('[data-toggle]') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    const clearBtn = el.querySelector('[data-clear]') as HTMLButtonElement;
    clearBtn.click();
    expect(emitted.some(e => e.cleared)).toBe(true);
  });

  it('HP-07: empty state shows message when expanded', async () => {
    const { el, fixture } = await setup([]);
    const toggle = el.querySelector('[data-toggle]') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(el.textContent?.toLowerCase()).toContain('sin historial');
  });
});
