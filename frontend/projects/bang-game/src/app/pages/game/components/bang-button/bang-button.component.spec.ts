import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BangButtonComponent } from './bang-button.component';

describe('BangButtonComponent', () => {
  let fixture: ComponentFixture<BangButtonComponent>;

  const create = (active: boolean, consumed: boolean) => {
    TestBed.configureTestingModule({ imports: [BangButtonComponent] });
    fixture = TestBed.createComponent(BangButtonComponent);
    fixture.componentRef.setInput('active', active);
    fixture.componentRef.setInput('tapConsumed', consumed);
    fixture.detectChanges();
  };

  it('renders the tap area', () => {
    create(false, false);
    expect(fixture.nativeElement.querySelector('[data-bang-area]')).not.toBeNull();
  });

  it('emits tap event when not active and tapConsumed is false (false start)', () => {
    create(false, false);
    const spy = vi.fn();
    fixture.componentInstance.tapped.subscribe(spy);
    fixture.nativeElement.querySelector('[data-bang-area]').click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('emits tap event when active and tapConsumed is false', () => {
    create(true, false);
    const spy = vi.fn();
    fixture.componentInstance.tapped.subscribe(spy);
    fixture.nativeElement.querySelector('[data-bang-area]').click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('does not emit tap event when active but tapConsumed is true', () => {
    create(true, true);
    const spy = vi.fn();
    fixture.componentInstance.tapped.subscribe(spy);
    fixture.nativeElement.querySelector('[data-bang-area]').click();
    expect(spy).not.toHaveBeenCalled();
  });

  // TRIANGULATE: shows BANG text when active
  it('shows BANG text when active', () => {
    create(true, false);
    expect(fixture.nativeElement.textContent).toContain('BANG');
  });

  it('shows "..." when not active and no label', () => {
    create(false, false);
    expect(fixture.nativeElement.textContent).toContain('...');
  });

  it('shows custom label when provided and not active', () => {
    TestBed.configureTestingModule({ imports: [BangButtonComponent] });
    fixture = TestBed.createComponent(BangButtonComponent);
    fixture.componentRef.setInput('active', false);
    fixture.componentRef.setInput('tapConsumed', false);
    fixture.componentRef.setInput('label', 'Preparados');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Preparados');
  });
});
