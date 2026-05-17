import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@shared/auth';
import { Habit, HabitStore } from './habit.store';
import { PushService } from './core/push.service';
import { RemindersService, ReminderResponse } from './core/reminders.service';
import { TimezoneService } from './core/timezone.service';
import { AuthSheetComponent } from './components/auth-sheet/auth-sheet.component';

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
  imports: [FormsModule, AuthSheetComponent],
})
export class App implements OnInit {
  private readonly store = inject(HabitStore);
  private readonly auth = inject(AuthService);
  private readonly push = inject(PushService);
  private readonly remindersApi = inject(RemindersService);
  private readonly tz = inject(TimezoneService);

  protected readonly emojiPicker = EMOJI_PICKER;

  protected readonly habits = signal<ReadonlyArray<Habit>>([]);
  protected readonly loaded = signal<boolean>(false);

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

  protected readonly justMarkedFor = signal<string | null>(null);
  private freshTimer: ReturnType<typeof setTimeout> | null = null;

  // Auth + reminders state
  protected readonly authState = this.auth.currentUser;
  protected readonly isAuthenticated = computed<boolean>(() => this.authState().kind === 'authenticated');
  protected readonly username = computed<string | null>(() => {
    const s = this.authState();
    return s.kind === 'authenticated' ? s.user.username : null;
  });

  protected readonly pushSupported = signal<boolean>(false);
  protected readonly showAuthSheet = signal<boolean>(false);
  protected readonly authIntentHabitId = signal<string | null>(null);

  /** Map habitId → reminder, loaded from backend on auth. */
  protected readonly reminders = signal<ReadonlyMap<string, ReminderResponse>>(new Map());

  /** Which habit currently has its inline time editor open. */
  protected readonly reminderEditorFor = signal<string | null>(null);
  protected readonly reminderEditorTime = signal<string>('20:00');
  protected readonly reminderBusy = signal<string | null>(null);
  protected readonly reminderError = signal<string | null>(null);

  private vapidKeyCache: string | null = null;

  protected readonly isEmpty = computed<boolean>(() => this.loaded() && this.habits().length === 0);

  async ngOnInit(): Promise<void> {
    this.pushSupported.set(this.push.isSupported());
    try {
      const items = await this.store.list();
      this.habits.set(items);
    } finally {
      this.loaded.set(true);
    }
    if (this.isAuthenticated()) {
      void this.loadReminders();
    }
  }

  // ─── Existing helpers ─────────────────────────────────────────────────
  protected streak(h: Habit): number { return streakOf(h.marks); }
  protected isMarkedToday(h: Habit): boolean { return h.marks.includes(this.today()); }
  protected isMarked(h: Habit, date: string): boolean { return h.marks.includes(date); }
  protected isToday(date: string): boolean { return date === this.today(); }
  protected isFreshCell(h: Habit, date: string): boolean {
    return this.justMarkedFor() === h.id && date === this.today();
  }

  // ─── Reminders ────────────────────────────────────────────────────────
  protected reminderFor(habitId: string): ReminderResponse | undefined {
    return this.reminders().get(habitId);
  }

  protected hasReminder(habitId: string): boolean {
    return this.reminders().has(habitId);
  }

  protected openReminderEditor(h: Habit): void {
    this.reminderError.set(null);
    if (!this.isAuthenticated()) {
      this.authIntentHabitId.set(h.id);
      this.showAuthSheet.set(true);
      return;
    }
    const existing = this.reminders().get(h.id);
    this.reminderEditorTime.set(existing?.localTime ?? '20:00');
    this.reminderEditorFor.set(h.id);
  }

  protected closeReminderEditor(): void {
    this.reminderEditorFor.set(null);
    this.reminderError.set(null);
  }

  protected async saveReminder(h: Habit): Promise<void> {
    const time = this.reminderEditorTime();
    if (!/^\d{2}:\d{2}$/.test(time)) {
      this.reminderError.set('Hora inválida');
      return;
    }
    this.reminderBusy.set(h.id);
    this.reminderError.set(null);
    try {
      const vapid = await this.getVapidKey();
      const sub = await this.push.subscribe(vapid);
      const reminder = await this.remindersApi.upsert({
        habitId: h.id,
        localTime: time,
        timezone: this.tz.current(),
        pushSubscription: sub,
      });
      const next = new Map(this.reminders());
      next.set(h.id, reminder);
      this.reminders.set(next);
      this.closeReminderEditor();
    } catch (err: unknown) {
      const msg = this.errorMessage(err) ?? 'No se pudo guardar el recordatorio';
      this.reminderError.set(msg);
    } finally {
      this.reminderBusy.set(null);
    }
  }

  protected async removeReminder(h: Habit): Promise<void> {
    this.reminderBusy.set(h.id);
    this.reminderError.set(null);
    try {
      await this.remindersApi.delete(h.id);
      const next = new Map(this.reminders());
      next.delete(h.id);
      this.reminders.set(next);
      this.closeReminderEditor();
    } catch (err: unknown) {
      this.reminderError.set(this.errorMessage(err) ?? 'No se pudo eliminar');
    } finally {
      this.reminderBusy.set(null);
    }
  }

  protected onAuthSuccess(): void {
    this.showAuthSheet.set(false);
    void this.loadReminders().then(() => {
      const intent = this.authIntentHabitId();
      if (intent) {
        const habit = this.habits().find(h => h.id === intent);
        this.authIntentHabitId.set(null);
        if (habit) this.openReminderEditor(habit);
      }
    });
  }

  protected closeAuthSheet(): void {
    this.showAuthSheet.set(false);
    this.authIntentHabitId.set(null);
  }

  protected openAuthSheet(): void {
    this.authIntentHabitId.set(null);
    this.showAuthSheet.set(true);
  }

  protected logout(): void {
    this.auth.logout();
    this.reminders.set(new Map());
    this.reminderEditorFor.set(null);
  }

  private async loadReminders(): Promise<void> {
    try {
      const list = await this.remindersApi.list();
      const map = new Map<string, ReminderResponse>();
      for (const r of list) map.set(r.habitId, r);
      this.reminders.set(map);
      void this.syncTimezoneIfChanged(list);
    } catch {
      // silent — user might be offline
    }
  }

  private async syncTimezoneIfChanged(list: ReadonlyArray<ReminderResponse>): Promise<void> {
    const current = this.tz.current();
    const stale = list.filter(r => r.timezone !== current);
    if (stale.length === 0) return;
    const sub = await this.push.current();
    if (!sub) return;
    for (const r of stale) {
      try {
        await this.remindersApi.upsert({
          habitId: r.habitId,
          localTime: r.localTime,
          timezone: current,
          pushSubscription: sub,
        });
      } catch {
        // silent — best effort
      }
    }
    void this.loadReminders();
  }

  private async getVapidKey(): Promise<string> {
    if (this.vapidKeyCache) return this.vapidKeyCache;
    this.vapidKeyCache = await this.remindersApi.vapidPublicKey();
    return this.vapidKeyCache;
  }

  private errorMessage(err: unknown): string | null {
    if (typeof err === 'object' && err !== null) {
      const anyErr = err as { error?: { error?: string }; message?: string };
      return anyErr.error?.error ?? anyErr.message ?? null;
    }
    return null;
  }

  // ─── Existing mutations ───────────────────────────────────────────────
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

  protected cancelRename(): void { this.editingId.set(null); }

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

  protected askDelete(h: Habit): void { this.confirmingDeleteFor.set(h.id); }

  protected async confirmDelete(h: Habit): Promise<void> {
    this.confirmingDeleteFor.set(null);
    this.menuOpenFor.set(null);
    this.habits.update(list => list.filter(x => x.id !== h.id));
    this.vibrate(60);
    await this.store.delete(h.id);
    // best-effort: clean up any server-side reminder for this habit
    if (this.reminders().has(h.id)) {
      try { await this.remindersApi.delete(h.id); } catch { /* silent */ }
      const next = new Map(this.reminders());
      next.delete(h.id);
      this.reminders.set(next);
    }
  }

  protected cancelDelete(): void { this.confirmingDeleteFor.set(null); }

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
