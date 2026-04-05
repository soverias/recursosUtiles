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

  it('does not emit tap event when not active', () => {
    create(false, false);
    const spy = vi.fn();
    fixture.componentInstance.tapped.subscribe(spy);
    fixture.nativeElement.querySelector('[data-bang-area]').click();
    expect(spy).not.toHaveBeenCalled();
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

  it('shows waiting text when not active', () => {
    create(false, false);
    expect(fixture.nativeElement.textContent).not.toContain('BANG');
  });
});
