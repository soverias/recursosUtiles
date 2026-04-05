import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CategoryFilterComponent } from './category-filter.component';

const TWO_CATEGORIES = ['games', 'utilities'];

function createComponent(
  categories: string[],
  active: string | null = null,
): ComponentFixture<CategoryFilterComponent> {
  const fixture = TestBed.createComponent(CategoryFilterComponent);
  fixture.componentRef.setInput('categories', categories);
  fixture.componentRef.setInput('active', active);
  fixture.detectChanges();
  return fixture;
}

describe('CategoryFilterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryFilterComponent],
    }).compileComponents();
  });

  it('CAT-01: renders "Todas" chip plus one chip per category', () => {
    const fixture = createComponent(TWO_CATEGORIES);
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll('button');
    expect(buttons.length).toBe(3);
    expect(el.textContent).toContain('Todas');
    expect(el.textContent).toContain('games');
    expect(el.textContent).toContain('utilities');
  });

  it('CAT-01b: with one category, renders "Todas" plus that category only', () => {
    const fixture = createComponent(['games']);
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(el.textContent).toContain('Todas');
    expect(el.textContent).toContain('games');
  });

  it('CAT-02: clicking a category chip emits that category', () => {
    const fixture = createComponent(TWO_CATEGORIES);
    const el = fixture.nativeElement as HTMLElement;
    const emitted: (string | null)[] = [];
    fixture.componentInstance.categorySelected.subscribe((v: string | null) =>
      emitted.push(v),
    );
    const buttons = el.querySelectorAll('button');
    (buttons[1] as HTMLButtonElement).click(); // 'games'
    expect(emitted).toEqual(['games']);
  });

  it('CAT-02b: clicking "Todas" emits null', () => {
    const fixture = createComponent(TWO_CATEGORIES, 'games');
    const el = fixture.nativeElement as HTMLElement;
    const emitted: (string | null)[] = [];
    fixture.componentInstance.categorySelected.subscribe((v: string | null) =>
      emitted.push(v),
    );
    const todasButton = el.querySelectorAll('button')[0] as HTMLButtonElement;
    todasButton.click();
    expect(emitted).toEqual([null]);
  });

  it('CAT-03: "Todas" chip is active by default when active is null', () => {
    const fixture = createComponent(TWO_CATEGORIES, null);
    const el = fixture.nativeElement as HTMLElement;
    const todasButton = el.querySelectorAll('button')[0] as HTMLButtonElement;
    expect(todasButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('CAT-04: selected chip has aria-pressed="true", others aria-pressed="false"', () => {
    const fixture = createComponent(TWO_CATEGORIES, 'games');
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll('button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false'); // Todas
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');  // games
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false'); // utilities
  });
});
