import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Counter, CounterStore } from './counter.store';

const STEP_CYCLE: ReadonlyArray<number> = [1, 5, 10];
const MAX_NAME_LENGTH = 32;

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class App implements OnInit {
  private readonly store = inject(CounterStore);

  protected readonly counters = signal<ReadonlyArray<Counter>>([]);
  protected readonly loaded = signal<boolean>(false);

  // Inline UI state
  protected readonly editingId = signal<string | null>(null);
  protected readonly editingValue = signal<string>('');
  protected readonly menuOpenFor = signal<string | null>(null);
  protected readonly confirmingDeleteFor = signal<string | null>(null);
  protected readonly addFormOpen = signal<boolean>(false);
  protected readonly newName = signal<string>('');
  protected readonly newStep = signal<number>(1);
  protected readonly newNameError = signal<string | null>(null);

  // Punch feedback (re-triggerable)
  protected readonly punchedId = signal<string | null>(null);
  private punchTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly isEmpty = computed<boolean>(() => this.loaded() && this.counters().length === 0);

  async ngOnInit(): Promise<void> {
    try {
      const items = await this.store.list();
      this.counters.set(items);
    } finally {
      this.loaded.set(true);
    }
  }

  protected increment(c: Counter): void {
    this.update(c, c.value + c.step);
    this.punch(c.id);
    this.vibrate(20);
  }

  protected decrement(c: Counter): void {
    this.update(c, c.value - c.step);
    this.punch(c.id);
    this.vibrate(20);
  }

  protected cycleStep(c: Counter): void {
    const idx = STEP_CYCLE.indexOf(c.step);
    const nextStep = STEP_CYCLE[(idx + 1) % STEP_CYCLE.length];
    this.persist({ ...c, step: nextStep });
  }

  protected startRename(c: Counter): void {
    if (this.menuOpenFor() === c.id) this.menuOpenFor.set(null);
    this.editingId.set(c.id);
    this.editingValue.set(c.name);
  }

  protected commitRename(c: Counter): void {
    const next = this.editingValue().trim().slice(0, MAX_NAME_LENGTH);
    this.editingId.set(null);
    if (!next || next === c.name) return;
    this.persist({ ...c, name: next });
  }

  protected cancelRename(): void {
    this.editingId.set(null);
  }

  protected toggleMenu(c: Counter): void {
    this.menuOpenFor.update(curr => curr === c.id ? null : c.id);
    this.confirmingDeleteFor.set(null);
  }

  protected reset(c: Counter): void {
    this.menuOpenFor.set(null);
    this.update(c, 0);
    this.punch(c.id);
    this.vibrate(60);
  }

  protected askDelete(c: Counter): void {
    this.confirmingDeleteFor.set(c.id);
  }

  protected async confirmDelete(c: Counter): Promise<void> {
    this.confirmingDeleteFor.set(null);
    this.menuOpenFor.set(null);
    this.counters.update(list => list.filter(x => x.id !== c.id));
    this.vibrate(60);
    await this.store.delete(c.id);
  }

  protected cancelDelete(): void {
    this.confirmingDeleteFor.set(null);
  }

  protected openAddForm(): void {
    this.addFormOpen.set(true);
    this.newName.set('');
    this.newStep.set(1);
    this.newNameError.set(null);
  }

  protected closeAddForm(): void {
    this.addFormOpen.set(false);
    this.newNameError.set(null);
  }

  protected async submitAdd(): Promise<void> {
    const name = this.newName().trim().slice(0, MAX_NAME_LENGTH);
    if (!name) {
      this.newNameError.set('Pon un nombre al contador');
      return;
    }
    const step = Math.max(1, Math.floor(this.newStep()) || 1);
    const counter: Counter = {
      id: this.newId(),
      name,
      value: 0,
      step,
      createdAt: Date.now(),
    };
    this.counters.update(list => [...list, counter]);
    this.closeAddForm();
    await this.store.put(counter);
  }

  private update(c: Counter, value: number): void {
    this.persist({ ...c, value });
  }

  private persist(next: Counter): void {
    this.counters.update(list => list.map(c => c.id === next.id ? next : c));
    void this.store.put(next);
  }

  private punch(id: string): void {
    this.punchedId.set(null);
    if (this.punchTimeout) clearTimeout(this.punchTimeout);
    requestAnimationFrame(() => {
      this.punchedId.set(id);
      this.punchTimeout = setTimeout(() => this.punchedId.set(null), 200);
    });
  }

  private vibrate(ms: number): void {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  }

  private newId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
