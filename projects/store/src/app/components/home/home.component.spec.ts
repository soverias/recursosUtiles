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

  it('HOME-01: renders one app-card per tool in the catalogue', () => {
    const fixture = createComponent();
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('app-card');
    expect(cards.length).toBe(TOOLS.length);
  });

  it('HOME-01 triangulate: catalogue has at least 2 tools', () => {
    expect(TOOLS.length).toBeGreaterThanOrEqual(2);
  });

  it('HOME-02: grid container has responsive column classes', () => {
    const fixture = createComponent();
    const el = fixture.nativeElement as HTMLElement;
    const grid = el.querySelector('.grid');
    expect(grid?.classList.contains('grid-cols-1')).toBe(true);
    expect(grid?.className).toContain('md:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-3');
  });
});
