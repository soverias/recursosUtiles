import { Injectable, signal, computed, inject } from '@angular/core';
import { EvalResult } from '../models/expression.model';
import { UnitCategory, UnitDefinition } from '../models/unit.model';
import { UNIT_CATEGORIES } from '../engine/conversion';
import { tokenize } from '../engine/tokenizer';
import { parse } from '../engine/parser';
import { evaluate } from '../engine/evaluator';
import { HistoryService } from './history.service';

// Unit symbols that trigger a space prefix when appended
const UNIT_SYMBOLS = new Set(
  UNIT_CATEGORIES.flatMap(c => c.units).map(u => u.symbol),
);

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class CalculatorService {
  private readonly historyService = inject(HistoryService);

  readonly categories = UNIT_CATEGORIES;

  readonly expression = signal<string>('');
  readonly activeCategory = signal<UnitCategory>('numeric');
  readonly outputUnit = signal<UnitDefinition | null>(null);

  readonly result = computed<EvalResult | null>(() => {
    const expr = this.expression().trim();
    if (!expr) return null;
    try {
      const tokens = tokenize(expr);
      const ast = parse(tokens);
      return evaluate(ast, this.outputUnit() ?? undefined);
    } catch {
      return null;
    }
  });

  readonly error = computed<string | null>(() => {
    const expr = this.expression().trim();
    if (!expr) return null;
    try {
      const tokens = tokenize(expr);
      const ast = parse(tokens);
      evaluate(ast, this.outputUnit() ?? undefined);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  });

  readonly quickUnits = computed<readonly UnitDefinition[]>(() => {
    const cat = this.categories.find(c => c.category === this.activeCategory());
    return cat?.units ?? [];
  });

  appendToExpression(value: string): void {
    const isUnit = UNIT_SYMBOLS.has(value);
    const separator = isUnit ? ' ' : '';
    this.expression.update(expr => expr + separator + value);
  }

  deleteLast(): void {
    this.expression.update(expr => expr.slice(0, -1));
  }

  clearExpression(): void {
    this.expression.set('');
  }

  calculate(): void {
    const expr = this.expression().trim();
    if (!expr) return;
    const result = this.result();
    if (!result) return;

    this.historyService.addEntry({
      id: nextId++,
      expression: expr,
      result,
      timestamp: Date.now(),
    });
  }

  setCategory(category: UnitCategory): void {
    this.activeCategory.set(category);
    this.outputUnit.set(null);
  }

  setOutputUnit(unit: UnitDefinition | null): void {
    this.outputUnit.set(unit);
  }

  loadExpression(expr: string): void {
    this.expression.set(expr);
  }
}
