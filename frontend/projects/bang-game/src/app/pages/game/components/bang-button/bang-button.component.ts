import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-bang-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      data-bang-area
      (click)="onTap()"
      class="w-full h-full flex items-center justify-center cursor-pointer select-none"
      [class]="active() ? 'bg-yellow-400' : 'bg-gray-800'"
    >
      @if (active()) {
        <span class="text-8xl font-black text-gray-900 animate-bounce">BANG!</span>
      } @else {
        <span class="text-gray-500 text-xl font-semibold">Espera...</span>
      }
    </div>
  `,
  host: { class: 'block w-full h-full' },
})
export class BangButtonComponent {
  readonly active = input(false);
  readonly tapConsumed = input(false);
  readonly tapped = output<void>();

  onTap(): void {
    if (!this.active() || this.tapConsumed()) return;
    this.tapped.emit();
  }
}
