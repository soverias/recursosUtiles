import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UnitCategory, UnitDefinition } from '../../core/models/unit.model';

@Component({
  selector: 'app-unit-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (activeCategory() !== 'numeric') {
      <div class="flex items-center gap-3 px-1">
        <span class="calc-unit-label">Resultado en</span>
        <select
          class="calc-select"
          [value]="outputUnit()?.symbol ?? ''"
          (change)="onOutputUnitChange($event)">
          <option value="">Automático</option>
          @for (unit of currentUnits(); track unit.symbol) {
            <option [value]="unit.symbol">{{ unit.symbol }} — {{ unit.name }}</option>
          }
        </select>
      </div>
    }
  `,
})
export class UnitSelectorComponent {
  readonly activeCategory = input.required<UnitCategory>();
  readonly outputUnit = input<UnitDefinition | null>(null);
  readonly currentUnits = input.required<readonly UnitDefinition[]>();

  readonly outputUnitChange = output<UnitDefinition | null>();

  onOutputUnitChange(event: Event): void {
    const symbol = (event.target as HTMLSelectElement).value;
    if (!symbol) {
      this.outputUnitChange.emit(null);
      return;
    }
    const unit = this.currentUnits().find(u => u.symbol === symbol) ?? null;
    this.outputUnitChange.emit(unit);
  }
}
