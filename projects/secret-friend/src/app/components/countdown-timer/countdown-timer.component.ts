import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';

@Component({
  selector: 'app-countdown-timer',
  template: `
    <div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div class="bg-white/20 backdrop-blur rounded-full w-14 h-14 flex items-center justify-center
                  text-white font-bold text-2xl border-2 border-white/40">
        {{ remaining() }}
      </div>
    </div>
  `,
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
