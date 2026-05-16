import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CategorySidebarComponent } from './category-sidebar.component';
import { UnitCategory } from '../../core/models/unit.model';
import { UNIT_CATEGORIES } from '../../core/engine/conversion';

describe('CategorySidebarComponent', () => {
  async function setup(opts: {
    activeCategory?: UnitCategory;
    collapsed?: boolean;
    mobileOpen?: boolean;
  } = {}) {
    const emitted: { category?: UnitCategory; collapse?: true; close?: true }[] = [];

    @Component({
      template: `
        <app-category-sidebar
          [categories]="categories"
          [activeCategory]="activeCategory"
          [collapsed]="collapsed"
          [mobileOpen]="mobileOpen"
          (categoryChange)="emitted.push({ category: $event })"
          (toggleCollapse)="emitted.push({ collapse: true })"
          (close)="emitted.push({ close: true })" />
      `,
      imports: [CategorySidebarComponent],
    })
    class Host {
      categories = UNIT_CATEGORIES;
      activeCategory: UnitCategory = opts.activeCategory ?? 'numeric';
      collapsed = opts.collapsed ?? false;
      mobileOpen = opts.mobileOpen ?? false;
      emitted = emitted;
    }

    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, emitted };
  }

  it('CS-01: muestra todos los labels de categoría cuando está expandido', async () => {
    const { el } = await setup({ collapsed: false });
    const text = el.textContent ?? '';
    expect(text).toContain('Numérico');
    expect(text).toContain('Datos');
    expect(text).toContain('Peso');
    expect(text).toContain('Volumen');
    expect(text).toContain('Temperatura');
    expect(text).toContain('Longitud');
  });

  it('CS-02: oculta los labels cuando está colapsado', async () => {
    const { el } = await setup({ collapsed: true });
    const text = el.textContent ?? '';
    expect(text).not.toContain('Numérico');
    expect(text).not.toContain('Datos');
  });

  it('CS-03: clicking una categoría emite categoryChange y close', async () => {
    const { el, emitted } = await setup({ activeCategory: 'numeric' });
    const btns = [...el.querySelectorAll('button')];
    const dataBtn = btns.find(b => b.textContent?.trim() === 'Datos') as HTMLButtonElement;
    dataBtn.click();
    expect(emitted.some(e => e.category === 'data')).toBe(true);
    expect(emitted.some(e => e.close)).toBe(true);
  });

  it('CS-04: aplica estilo activo a la categoría seleccionada', async () => {
    const { el } = await setup({ activeCategory: 'weight' });
    const btns = [...el.querySelectorAll('button')].filter(b =>
      b.textContent?.trim() === 'Peso',
    );
    expect(btns.length).toBe(1);
    expect(btns[0].classList.contains('active')).toBe(true);
  });

  it('CS-05: el botón de colapso emite toggleCollapse', async () => {
    const { el, emitted } = await setup();
    const toggle = el.querySelector('[data-collapse-toggle]') as HTMLButtonElement;
    toggle.click();
    expect(emitted.some(e => e.collapse)).toBe(true);
  });

  it('CS-06: sidebar oculto en móvil cuando mobileOpen es false', async () => {
    const { el } = await setup({ mobileOpen: false });
    const aside = el.querySelector('aside') as HTMLElement;
    expect(aside.classList.contains('-translate-x-full')).toBe(true);
  });

  it('CS-07: sidebar visible en móvil cuando mobileOpen es true', async () => {
    const { el } = await setup({ mobileOpen: true });
    const aside = el.querySelector('aside') as HTMLElement;
    expect(aside.classList.contains('-translate-x-full')).toBe(false);
  });
});
