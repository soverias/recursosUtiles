import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { UnitSelectorComponent } from './unit-selector.component';
import { UnitCategory, UnitDefinition } from '../../core/models/unit.model';
import { UNIT_CATEGORIES } from '../../core/engine/conversion';

describe('UnitSelectorComponent', () => {
  function unitsFor(category: UnitCategory): readonly UnitDefinition[] {
    return UNIT_CATEGORIES.find(c => c.category === category)?.units ?? [];
  }

  async function setup(activeCategory: UnitCategory = 'numeric', outputUnit: UnitDefinition | null = null) {
    const emitted: { outputUnit?: UnitDefinition | null }[] = [];

    @Component({
      template: `
        <app-unit-selector
          [activeCategory]="activeCategory"
          [outputUnit]="outputUnit"
          [currentUnits]="currentUnits"
          (outputUnitChange)="emitted.push({ outputUnit: $event })" />
      `,
      imports: [UnitSelectorComponent],
    })
    class Host {
      activeCategory = activeCategory;
      outputUnit = outputUnit;
      currentUnits = unitsFor(activeCategory);
      emitted = emitted;
    }

    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, emitted };
  }

  it('US-01: selector de unidad oculto en modo numérico', async () => {
    const { el } = await setup('numeric');
    expect(el.querySelectorAll('select')).toHaveLength(0);
  });

  it('US-02: selector de unidad visible para la categoría datos', async () => {
    const { el } = await setup('data');
    expect(el.querySelector('select')).not.toBeNull();
  });

  it('US-03: selector contiene las unidades de la categoría activa', async () => {
    const { el } = await setup('data');
    const text = el.textContent ?? '';
    expect(text).toContain('GB');
    expect(text).toContain('MB');
  });

  it('US-04: seleccionar una unidad emite outputUnitChange', async () => {
    const { el, emitted, fixture } = await setup('data');
    const select = el.querySelector('select') as HTMLSelectElement;
    select.value = 'MB';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(emitted.some(e => e.outputUnit?.symbol === 'MB')).toBe(true);
  });

  it('US-05: seleccionar vacío emite null', async () => {
    const { el, emitted, fixture } = await setup('data');
    const select = el.querySelector('select') as HTMLSelectElement;
    select.value = '';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(emitted.some(e => e.outputUnit === null)).toBe(true);
  });
});
