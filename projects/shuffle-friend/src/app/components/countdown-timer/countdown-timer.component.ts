import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';

@Component({
  selector: 'app-countdown-timer',
  template: '<span>{{ remaining() }}</span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownTimerComponent implements OnInit {
  readonly duration = input<number>(5);
  readonly timerEnd = output<void>();

  protected readonly remaining = signal(0);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.remaining.set(this.duration());
    if (this.remaining() <= 0) {
      this.timerEnd.emit();
      return;
    }
    const handle = setInterval(() => {
      this.remaining.update(v => v - 1);
      if (this.remaining() <= 0) {
        clearInterval(handle);
        this.timerEnd.emit();
      }
    }, 1000);
    this.destroyRef.onDestroy(() => clearInterval(handle));
  }
}
