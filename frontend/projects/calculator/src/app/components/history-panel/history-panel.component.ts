import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { HistoryEntry } from '../../core/models/expression.model';

@Component({
  selector: 'app-history-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <button data-toggle class="calc-history-toggle" (click)="isExpanded.set(!isExpanded())">
        <span>Historial · {{ entries().length }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"
             class="w-3.5 h-3.5 transition-transform duration-200"
             [class.rotate-180]="isExpanded()">
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      @if (isExpanded()) {
        <div class="flex flex-col gap-1.5 px-3 pb-4 max-h-52 overflow-y-auto">
          @if (entries().length === 0) {
            <p class="text-center py-6"
               style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:var(--c-muted)">
              — sin historial —
            </p>
          } @else {
            @for (entry of entries(); track entry.id) {
              <button data-entry class="calc-history-entry" (click)="entrySelected.emit(entry)">
                <div class="calc-history-expr">{{ entry.expression }}</div>
                <div class="calc-history-result">= {{ entry.result.formatted }}</div>
              </button>
            }
            <button data-clear class="calc-history-clear" (click)="clearHistory.emit()">
              Limpiar historial
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class HistoryPanelComponent {
  readonly entries = input.required<readonly HistoryEntry[]>();
  readonly entrySelected = output<HistoryEntry>();
  readonly clearHistory = output<void>();

  readonly isExpanded = signal(false);
}
