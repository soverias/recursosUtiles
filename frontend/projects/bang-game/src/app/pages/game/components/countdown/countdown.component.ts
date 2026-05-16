import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, output, signal } from '@angular/core';

const STEPS = ['Preparados', 'Listos'];

@Component({
  selector: 'app-countdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center">
      <p data-countdown class="text-5xl font-black text-white tracking-wide animate-pulse">
        {{ label() }}
      </p>
    </div>
  `,
})
export class CountdownComponent implements OnInit {
  readonly countdownEnd = output<void>();

  readonly label = signal(STEPS[0]);
  private readonly destroyRef = inject(DestroyRef);
  private step = 0;

  ngOnInit(): void {
    const handle = setInterval(() => {
      this.step++;
      if (this.step >= STEPS.length) {
        clearInterval(handle);
        this.countdownEnd.emit();
        return;
      }
      this.label.set(STEPS[this.step]);
    }, 1000);
    this.destroyRef.onDestroy(() => clearInterval(handle));
  }
}
