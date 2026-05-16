import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EvalResult } from '../../core/models/expression.model';

@Component({
  selector: 'app-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="calc-display" [class.glowing]="!!result() && !error()">
      <div class="calc-expr">{{ expression() || '0' }}</div>

      @if (error()) {
        <div class="calc-result-error">{{ error() }}</div>
      } @else if (result()) {
        <div class="calc-result">{{ result()!.formatted }}</div>
      } @else {
        <div class="calc-result-placeholder">0</div>
      }
    </div>
  `,
})
export class DisplayComponent {
  readonly expression = input.required<string>();
  readonly result = input<EvalResult | null>(null);
  readonly error = input<string | null>(null);
}
