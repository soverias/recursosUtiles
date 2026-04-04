import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CountdownTimerComponent } from './countdown-timer.component';

describe('CountdownTimerComponent', () => {
  let fixture: ComponentFixture<CountdownTimerComponent>;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [CountdownTimerComponent] });
    fixture = TestBed.createComponent(CountdownTimerComponent);
    fixture.componentRef.setInput('duration', 5);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the initial duration value', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text.trim()).toBe('5');
  });

  it('decrements by 1 after 1000ms', () => {
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text.trim()).toBe('4');
  });

  it('emits timerEnd when countdown reaches 0', () => {
    const spy = vi.spyOn(fixture.componentInstance.timerEnd, 'emit');
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  });

  it('emits timerEnd immediately when duration is 0', () => {
    // ngOnInit emits synchronously when duration <= 0 — no timer needed
    const f2 = TestBed.createComponent(CountdownTimerComponent);
    f2.componentRef.setInput('duration', 0);
    const spy = vi.spyOn(f2.componentInstance.timerEnd, 'emit');
    f2.detectChanges();
    expect(spy).toHaveBeenCalled();
  });
});
