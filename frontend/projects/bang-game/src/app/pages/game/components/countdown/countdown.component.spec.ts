import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CountdownComponent } from './countdown.component';

describe('CountdownComponent', () => {
  let fixture: ComponentFixture<CountdownComponent>;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [CountdownComponent] });
    fixture = TestBed.createComponent(CountdownComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays first step initially', () => {
    expect(fixture.nativeElement.querySelector('[data-countdown]').textContent.trim()).toBe('Preparados');
  });

  it('advances to next step after 1 second', async () => {
    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-countdown]').textContent.trim()).toBe('Listos');
  });

  it('emits countdownEnd after all steps complete', async () => {
    const spy = vi.fn();
    fixture.componentInstance.countdownEnd.subscribe(spy);
    await vi.advanceTimersByTimeAsync(2000);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('does not emit countdownEnd before steps complete', async () => {
    const spy = vi.fn();
    fixture.componentInstance.countdownEnd.subscribe(spy);
    await vi.advanceTimersByTimeAsync(999);
    fixture.detectChanges();
    expect(spy).not.toHaveBeenCalled();
  });
});
