import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RevealCardComponent } from './reveal-card.component';

describe('RevealCardComponent', () => {
  let fixture: ComponentFixture<RevealCardComponent>;

  function setup(isRevealed = false) {
    TestBed.configureTestingModule({ imports: [RevealCardComponent] });
    fixture = TestBed.createComponent(RevealCardComponent);
    fixture.componentRef.setInput('giverName', 'Alice');
    fixture.componentRef.setInput('receiverName', 'Bob');
    fixture.componentRef.setInput('isRevealed', isRevealed);
    fixture.detectChanges();
  }

  it('shows the giver name', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Alice');
  });

  it('receiver name is hidden before reveal', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Bob');
  });

  it('shows receiver name after clicking reveal button', () => {
    setup();
    const btn = fixture.nativeElement.querySelector('button[data-reveal]');
    btn.click();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Bob');
  });

  it('does NOT emit dismiss when reveal button clicked (only shows the name)', () => {
    setup();
    const spy = vi.spyOn(fixture.componentInstance.dismiss, 'emit');
    const btn = fixture.nativeElement.querySelector('button[data-reveal]');
    btn.click();
    fixture.detectChanges();
    expect(spy).not.toHaveBeenCalled();
  });

  it('emits dismiss when close button clicked after reveal', () => {
    setup();
    const spy = vi.spyOn(fixture.componentInstance.dismiss, 'emit');
    fixture.nativeElement.querySelector('button[data-reveal]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button.mt-6').click();
    expect(spy).toHaveBeenCalled();
  });

  it('shows receiver immediately when isRevealed is true', () => {
    setup(true);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Bob');
  });
});
