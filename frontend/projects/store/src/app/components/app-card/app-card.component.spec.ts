import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { AppCardComponent } from './app-card.component';
import { Tool } from '../../models/tool.model';

const BANG_TOOL: Tool = {
  id: 'bang-game',
  name: 'Bang! Game',
  description: 'Juego de cartas multijugador',
  category: 'games',
  icon: '🎯',
  url: 'https://example.com/bang',
  color: '#b91c1c',
};

const SHUFFLE_TOOL: Tool = {
  id: 'shuffle-friend',
  name: 'Shuffle Friend',
  description: 'Sortea amigos invisibles',
  category: 'utilities',
  icon: '🔀',
  url: 'https://example.com/shuffle',
  color: '#0369a1',
};

function createComponent(tool: Tool): ComponentFixture<AppCardComponent> {
  const fixture = TestBed.createComponent(AppCardComponent);
  fixture.componentRef.setInput('tool', tool);
  fixture.detectChanges();
  return fixture;
}

describe('AppCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppCardComponent],
    }).compileComponents();
  });

  it('CARD-01: renders the tool name', () => {
    const fixture = createComponent(BANG_TOOL);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Bang! Game');
  });

  it('CARD-01 triangulate: renders a different tool name', () => {
    const fixture = createComponent(SHUFFLE_TOOL);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Shuffle Friend');
  });

  it('CARD-02: renders the tool description', () => {
    const fixture = createComponent(BANG_TOOL);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Juego de cartas multijugador');
  });

  it('CARD-03: link points to the tool url', () => {
    const fixture = createComponent(BANG_TOOL);
    const el = fixture.nativeElement as HTMLElement;
    const anchor = el.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://example.com/bang');
  });

  it('CARD-03 triangulate: link points to different url', () => {
    const fixture = createComponent(SHUFFLE_TOOL);
    const el = fixture.nativeElement as HTMLElement;
    const anchor = el.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://example.com/shuffle');
  });

  it('CARD-04: link opens in new tab with noopener', () => {
    const fixture = createComponent(BANG_TOOL);
    const el = fixture.nativeElement as HTMLElement;
    const anchor = el.querySelector('a');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toContain('noopener');
  });
});
