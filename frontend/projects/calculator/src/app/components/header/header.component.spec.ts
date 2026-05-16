import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  async function setup() {
    const emitted: string[] = [];

    @Component({
      template: `<app-header (menuToggle)="emitted.push('toggle')" />`,
      imports: [HeaderComponent],
    })
    class Host {
      emitted = emitted;
    }

    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, emitted };
  }

  it('HEADER-01: muestra el título "Calculadora"', async () => {
    const { el } = await setup();
    expect(el.textContent).toContain('Calculadora');
  });

  it('HEADER-02: el botón hamburger emite menuToggle al hacer click', async () => {
    const { el, emitted } = await setup();
    const btn = el.querySelector('[data-hamburger]') as HTMLButtonElement;
    btn.click();
    expect(emitted).toContain('toggle');
  });
});
