import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CalculatorService } from './core/services/calculator.service';
import { HistoryService } from './core/services/history.service';
import { HistoryEntry } from './core/models/expression.model';
import { UnitCategory, UnitDefinition } from './core/models/unit.model';
import { HeaderComponent } from './components/header/header.component';
import { DisplayComponent } from './components/display/display.component';
import { KeypadComponent } from './components/keypad/keypad.component';
import { UnitSelectorComponent } from './components/unit-selector/unit-selector.component';
import { HistoryPanelComponent } from './components/history-panel/history-panel.component';
import { CategorySidebarComponent } from './components/category-sidebar/category-sidebar.component';
import { ToastOutletComponent } from '@shared/ui';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    DisplayComponent,
    KeypadComponent,
    UnitSelectorComponent,
    HistoryPanelComponent,
    CategorySidebarComponent,
    ToastOutletComponent,
  ],
})
export class App {
  private readonly calc = inject(CalculatorService);
  private readonly history = inject(HistoryService);

  readonly expression = this.calc.expression;
  readonly result = this.calc.result;
  readonly error = this.calc.error;
  readonly activeCategory = this.calc.activeCategory;
  readonly outputUnit = this.calc.outputUnit;
  readonly categories = this.calc.categories;
  readonly quickUnits = this.calc.quickUnits;
  readonly historyEntries = this.history.entries;

  readonly sidebarOpen = signal(false);
  readonly sidebarCollapsed = signal(false);

  onKeyPress(key: string): void {
    switch (key) {
      case 'C': this.calc.clearExpression(); break;
      case '⌫': this.calc.deleteLast(); break;
      case '=': this.calc.calculate(); break;
      default: this.calc.appendToExpression(key);
    }
  }

  onCategoryChange(cat: UnitCategory): void {
    this.calc.setCategory(cat);
  }

  onOutputUnitChange(unit: UnitDefinition | null): void {
    this.calc.setOutputUnit(unit);
  }

  onEntrySelected(entry: HistoryEntry): void {
    this.calc.loadExpression(entry.expression);
  }

  onClearHistory(): void {
    this.history.clearHistory();
  }
}
