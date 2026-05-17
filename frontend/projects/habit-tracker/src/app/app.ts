import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Habit, HabitStore } from './habit.store';

const MAX_NAME_LENGTH = 40;
const HEATMAP_DAYS = 30;
const EMOJI_PICKER: ReadonlyArray<string> = [
  '🔥', '💪', '📚', '🏃', '💧', '🥗',
  '🧘', '🎯', '✨', '💤', '🎨', '⏰',
];

function pad2(n: number): string { return String(n).padStart(2, '0'); }

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function shiftISO(iso: string, days: number): string {
  const [y, m, dd] = iso.split('-').map(Number);
  const d = new Date(y, m - 1, dd + days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function last30Days(): string[] {
  const today = todayISO();
  const out: string[] = [];
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) out.push(shiftISO(today, -i));
  return out;
}

function streakOf(marks: ReadonlyArray<string>): number {
  if (marks.length === 0) return 0;
  const set = new Set(marks);
  const today = todayISO();
  const yesterday = shiftISO(today, -1);
  let cursor: string;
  if (set.has(today)) cursor = today;
  else if (set.has(yesterday)) cursor = yesterday;
  else return 0;
  let count = 0;
  while (set.has(cursor)) {
    count++;
    cursor = shiftISO(cursor, -1);
  }
  return count;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class App implements OnInit {
  private readonly store = inject(HabitStore);

  protected readonly emojiPicker = EMOJI_PICKER;

  protected readonly habits = signal<ReadonlyArray<Habit>>([]);
  protected readonly loaded = signal<boolean>(false);

  // Today is captured at component creation. For a session that crosses midnight
  // the user would need to refresh — acceptable UX cost for simplicity.
  protected readonly today = signal<string>(todayISO());
  protected readonly heatmapDays = signal<ReadonlyArray<string>>(last30Days());

  // Inline UI state
  protected readonly editingId = signal<string | null>(null);
  protected readonly editingValue = signal<string>('');
  protected readonly emojiPickerFor = signal<string | null>(null);
  protected readonly menuOpenFor = signal<string | null>(null);
  protected readonly confirmingDeleteFor = signal<string | null>(null);

  protected readonly addFormOpen = signal<boolean>(false);
  protected readonly newName = signal<string>('');
  protected readonly newEmoji = signal<string>('🔥');
  protected readonly newNameError = signal<string | null>(null);

  // Animation feedback — which cell just got marked (for pop animation)
  protected readonly justMarkedFor = signal<string | null>(null);
  private freshTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly isEmpty = computed<boolean>(() => this.loaded() && this.habits().length === 0);

  async ngOnInit(): Promise<void> {
    try {
      const items = await this.store.list();
      this.habits.set(items);
    } finally {
      this.loaded.set(true);
    }
  }

  // ─── Computed helpers used in template ────────────────────────────────
  protected streak(h: Habit): number {
    return streakOf(h.marks);
  }

  protected isMarkedToday(h: Habit): boolean {
    return h.marks.includes(this.today());
  }

  protected isMarked(h: Habit, date: string): boolean {
    return h.marks.includes(date);
  }

  protected isToday(date: string): boolean {
    return date === this.today();
  }

  protected isFreshCell(h: Habit, date: string): boolean {
    return this.justMarkedFor() === h.id && date === this.today();
  }

  // ─── Mutations ────────────────────────────────────────────────────────
  protected toggleToday(h: Habit): void {
    const today = this.today();
    const marked = h.marks.includes(today);
    const next: Habit = {
      ...h,
      marks: marked ? h.marks.filter(d => d !== today) : [...h.marks, today].sort(),
    };
    this.persist(next);
    if (!marked) {
      this.flashFresh(h.id);
      this.vibrate(30);
    } else {
      this.vibrate(15);
    }
  }

  protected startRename(h: Habit): void {
    if (this.menuOpenFor() === h.id) this.menuOpenFor.set(null);
    this.emojiPickerFor.set(null);
    this.editingId.set(h.id);
    this.editingValue.set(h.name);
  }

  protected commitRename(h: Habit): void {
    const next = this.editingValue().trim().slice(0, MAX_NAME_LENGTH);
    this.editingId.set(null);
    if (!next || next === h.name) return;
    this.persist({ ...h, name: next });
  }

  protected cancelRename(): void {
    this.editingId.set(null);
  }

  protected toggleEmojiPicker(h: Habit): void {
    this.editingId.set(null);
    this.menuOpenFor.set(null);
    this.emojiPickerFor.update(curr => curr === h.id ? null : h.id);
  }

  protected pickEmoji(h: Habit, emoji: string): void {
    this.emojiPickerFor.set(null);
    if (emoji === h.emoji) return;
    this.persist({ ...h, emoji });
  }

  protected toggleMenu(h: Habit): void {
    this.emojiPickerFor.set(null);
    this.menuOpenFor.update(curr => curr === h.id ? null : h.id);
    this.confirmingDeleteFor.set(null);
  }

  protected askDelete(h: Habit): void {
    this.confirmingDeleteFor.set(h.id);
  }

  protected async confirmDelete(h: Habit): Promise<void> {
    this.confirmingDeleteFor.set(null);
    this.menuOpenFor.set(null);
    this.habits.update(list => list.filter(x => x.id !== h.id));
    this.vibrate(60);
    await this.store.delete(h.id);
  }

  protected cancelDelete(): void {
    this.confirmingDeleteFor.set(null);
  }

  protected openAddForm(): void {
    this.addFormOpen.set(true);
    this.newName.set('');
    this.newEmoji.set('🔥');
    this.newNameError.set(null);
  }

  protected closeAddForm(): void {
    this.addFormOpen.set(false);
    this.newNameError.set(null);
  }

  protected async submitAdd(): Promise<void> {
    const name = this.newName().trim().slice(0, MAX_NAME_LENGTH);
    if (!name) {
      this.newNameError.set('Pon un nombre al hábito');
      return;
    }
    const habit: Habit = {
      id: this.newId(),
      name,
      emoji: this.newEmoji() || '🔥',
      marks: [],
      createdAt: Date.now(),
    };
    this.habits.update(list => [...list, habit]);
    this.closeAddForm();
    await this.store.put(habit);
  }

  private persist(next: Habit): void {
    this.habits.update(list => list.map(h => h.id === next.id ? next : h));
    void this.store.put(next);
  }

  private flashFresh(id: string): void {
    if (this.freshTimer) clearTimeout(this.freshTimer);
    this.justMarkedFor.set(null);
    requestAnimationFrame(() => {
      this.justMarkedFor.set(id);
      this.freshTimer = setTimeout(() => this.justMarkedFor.set(null), 450);
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
    return `h_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
