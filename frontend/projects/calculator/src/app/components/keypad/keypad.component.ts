import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UnitDefinition } from '../../core/models/unit.model';

type KeyType = 'num' | 'op' | 'eq' | 'danger' | 'paren';

interface KeyDef {
  label: string;
  value: string;
  type: KeyType;
}

const KEYS: KeyDef[] = [
  { label: 'C',  value: 'C',  type: 'danger' },
  { label: '(',  value: '(',  type: 'paren' },
  { label: ')',  value: ')',  type: 'paren' },
  { label: '÷',  value: '/',  type: 'op' },
  { label: '7',  value: '7',  type: 'num' },
  { label: '8',  value: '8',  type: 'num' },
  { label: '9',  value: '9',  type: 'num' },
  { label: '×',  value: '*',  type: 'op' },
  { label: '4',  value: '4',  type: 'num' },
  { label: '5',  value: '5',  type: 'num' },
  { label: '6',  value: '6',  type: 'num' },
  { label: '−',  value: '-',  type: 'op' },
  { label: '1',  value: '1',  type: 'num' },
  { label: '2',  value: '2',  type: 'num' },
  { label: '3',  value: '3',  type: 'num' },
  { label: '+',  value: '+',  type: 'op' },
  { label: '0',  value: '0',  type: 'num' },
  { label: '.',  value: '.',  type: 'num' },
  { label: '⌫',  value: '⌫',  type: 'danger' },
  { label: '=',  value: '=',  type: 'eq' },
];

const TYPE_CLASS: Record<KeyType, string> = {
  num:    'calc-btn',
  op:     'calc-btn calc-btn-op',
  eq:     'calc-btn calc-btn-eq',
  danger: 'calc-btn calc-btn-danger',
  paren:  'calc-btn calc-btn-paren',
};

@Component({
  selector: 'app-keypad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2 p-3">
      @if (quickUnits().length > 0) {
        <div class="flex gap-2 overflow-x-auto pb-1">
          @for (unit of quickUnits(); track unit.symbol) {
            <button class="calc-unit-btn" (click)="keyPress.emit(unit.symbol)">
              {{ unit.symbol }}
            </button>
          }
        </div>
      }

      <div class="grid grid-cols-4 gap-2">
        @for (key of keys; track key.value) {
          <button [class]="typeClass(key.type)" (click)="keyPress.emit(key.value)">
            {{ key.label }}
          </button>
        }
      </div>
    </div>
  `,
})
export class KeypadComponent {
  readonly quickUnits = input<readonly UnitDefinition[]>([]);
  readonly keyPress = output<string>();

  readonly keys = KEYS;

  typeClass(type: KeyType): string {
    return TYPE_CLASS[type];
  }
}
