import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { TOOLS } from '../../data/tools.data';

function createComponent(): ComponentFixture<HomeComponent> {
  const fixture = TestBed.createComponent(HomeComponent);
  fixture.detectChanges();
  return fixture;
}

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();
  });

  it('HOME-01: renders one app-card per tool when no filter is active', () => {
    const fixture = createComponent();
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('app-card');
    expect(cards.length).toBe(TOOLS.length);
  });

  it('HOME-01 triangulate: catalogue has at least 2 tools', () => {
    expect(TOOLS.length).toBeGreaterThanOrEqual(2);
  });

  it('HOME-01b: filters grid when a category chip is selected', () => {
    const fixture = createComponent();
    const el = fixture.nativeElement as HTMLElement;
    const categoryButtons = el.querySelectorAll('app-category-filter button');
    // buttons[0] = Todas, buttons[1] = first real category (games)
    (categoryButtons[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const cards = el.querySelectorAll('app-card');
    const gamesCount = TOOLS.filter(t => t.category === 'games').length;
    expect(cards.length).toBe(gamesCount);
    expect(cards.length).toBeGreaterThan(0);
  });

  it('HOME-02: grid container has responsive column classes', () => {
    const fixture = createComponent();
    const el = fixture.nativeElement as HTMLElement;
    const grid = el.querySelector('.grid');
    expect(grid?.classList.contains('grid-cols-1')).toBe(true);
    expect(grid?.className).toContain('md:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-3');
  });

  it('HOME-03: renders CategoryFilterComponent above the grid', () => {
    const fixture = createComponent();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-category-filter')).not.toBeNull();
  });
});
