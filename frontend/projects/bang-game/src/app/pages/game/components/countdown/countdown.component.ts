import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';

@Component({
  selector: 'app-countdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center">
      <div data-countdown
        class="w-28 h-28 rounded-full bg-gray-800 border-4 border-yellow-400 flex items-center justify-center text-6xl font-black text-white">
        {{ remaining() }}
      </div>
    </div>
  `,
})
export class CountdownComponent implements OnInit {
  readonly seconds = input(3);
  readonly countdownEnd = output<void>();

  readonly remaining = signal(0);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.remaining.set(this.seconds());
    const handle = setInterval(() => {
      this.remaining.update(v => v - 1);
      if (this.remaining() <= 0) {
        clearInterval(handle);
        this.countdownEnd.emit();
      }
    }, 1000);
    this.destroyRef.onDestroy(() => clearInterval(handle));
  }
}
