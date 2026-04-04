import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  function setup(open: boolean) {
    TestBed.configureTestingModule({ imports: [ConfirmDialogComponent] });
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.componentRef.setInput('message', 'Test message');
    fixture.detectChanges();
  }

  it('is not visible when open is false', () => {
    setup(false);
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeNull();
  });

  it('shows title and message when open is true', () => {
    setup(true);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Test Title');
    expect(text).toContain('Test message');
  });

  it('emits confirm when confirm button clicked', () => {
    setup(true);
    const spy = vi.spyOn(fixture.componentInstance.confirm, 'emit');
    const btn = fixture.nativeElement.querySelector('button[data-confirm]');
    btn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('emits cancel when cancel button clicked', () => {
    setup(true);
    const spy = vi.spyOn(fixture.componentInstance.cancel, 'emit');
    const btn = fixture.nativeElement.querySelector('button[data-cancel]');
    btn.click();
    expect(spy).toHaveBeenCalled();
  });
});
