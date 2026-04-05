import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CountdownComponent } from './countdown.component';

describe('CountdownComponent', () => {
  let fixture: ComponentFixture<CountdownComponent>;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [CountdownComponent] });
    fixture = TestBed.createComponent(CountdownComponent);
    fixture.componentRef.setInput('seconds', 3);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays initial seconds value', () => {
    expect(fixture.nativeElement.querySelector('[data-countdown]').textContent.trim()).toBe('3');
  });

  it('decrements each second', async () => {
    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-countdown]').textContent.trim()).toBe('2');
  });

  it('emits countdownEnd when seconds reach 0', async () => {
    const spy = vi.fn();
    fixture.componentInstance.countdownEnd.subscribe(spy);
    await vi.advanceTimersByTimeAsync(3000);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledOnce();
  });

  // TRIANGULATE: different duration
  it('works with seconds=1 — emits countdownEnd after 1 second', async () => {
    const f2 = TestBed.createComponent(CountdownComponent);
    f2.componentRef.setInput('seconds', 1);
    f2.detectChanges();
    const spy = vi.fn();
    f2.componentInstance.countdownEnd.subscribe(spy);
    await vi.advanceTimersByTimeAsync(1000);
    f2.detectChanges();
    expect(spy).toHaveBeenCalledOnce();
  });
});
