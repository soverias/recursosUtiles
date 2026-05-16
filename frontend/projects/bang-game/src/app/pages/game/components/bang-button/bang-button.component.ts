import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-bang-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      data-bang-area
      (click)="onTap()"
      class="flex-1 flex items-center justify-center cursor-pointer select-none"
      [class]="active() ? 'bg-yellow-400' : 'bg-gray-900'"
    >
      @if (active()) {
        <span class="text-8xl font-black text-gray-900 animate-bounce">BANG!</span>
      } @else {
        <span class="text-6xl font-black text-gray-300 animate-pulse tracking-wide">
          {{ label() ?? '...' }}
        </span>
      }
    </div>
  `,
  host: { class: 'flex flex-col flex-1 w-full' },
})
export class BangButtonComponent {
  readonly active = input(false);
  readonly tapConsumed = input(false);
  readonly label = input<string | null>(null);
  readonly tapped = output<void>();

  onTap(): void {
    if (this.tapConsumed()) return;
    this.tapped.emit();
  }
}
