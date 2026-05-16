import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { BotDifficultyPickerComponent } from './bot-difficulty-picker.component';
import { BotDifficulty } from '../../../../core/models/bot.model';

describe('BotDifficultyPickerComponent', () => {
  let fixture: ComponentFixture<BotDifficultyPickerComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotDifficultyPickerComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(BotDifficultyPickerComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  // --- renderizado ---

  it('renderiza tres botones', () => {
    const buttons = el.querySelectorAll('button');
    expect(buttons.length).toBe(3);
  });

  it('cada botón tiene el atributo data-difficulty correcto', () => {
    const keys: BotDifficulty[] = ['easy', 'medium', 'hard'];
    keys.forEach(key => {
      expect(el.querySelector(`[data-difficulty="${key}"]`)).not.toBeNull();
    });
  });

  it('muestra las etiquetas Fácil, Medio y Difícil', () => {
    const text = el.textContent ?? '';
    expect(text).toContain('Fácil');
    expect(text).toContain('Medio');
    expect(text).toContain('Difícil');
  });

  // --- output ---

  it('emite "easy" al pulsar el botón Fácil', () => {
    const emitted: BotDifficulty[] = [];
    fixture.componentInstance.selected.subscribe((d: BotDifficulty) => emitted.push(d));

    (el.querySelector('[data-difficulty="easy"]') as HTMLButtonElement).click();
    expect(emitted).toEqual(['easy']);
  });

  it('emite "medium" al pulsar el botón Medio', () => {
    const emitted: BotDifficulty[] = [];
    fixture.componentInstance.selected.subscribe((d: BotDifficulty) => emitted.push(d));

    (el.querySelector('[data-difficulty="medium"]') as HTMLButtonElement).click();
    expect(emitted).toEqual(['medium']);
  });

  it('emite "hard" al pulsar el botón Difícil', () => {
    const emitted: BotDifficulty[] = [];
    fixture.componentInstance.selected.subscribe((d: BotDifficulty) => emitted.push(d));

    (el.querySelector('[data-difficulty="hard"]') as HTMLButtonElement).click();
    expect(emitted).toEqual(['hard']);
  });

  it('puede emitir varias selecciones consecutivas', () => {
    const emitted: BotDifficulty[] = [];
    fixture.componentInstance.selected.subscribe((d: BotDifficulty) => emitted.push(d));

    (el.querySelector('[data-difficulty="easy"]') as HTMLButtonElement).click();
    (el.querySelector('[data-difficulty="hard"]') as HTMLButtonElement).click();
    expect(emitted).toEqual(['easy', 'hard']);
  });
});
