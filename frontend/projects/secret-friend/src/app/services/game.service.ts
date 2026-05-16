import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Assignment, Exclusion, GamePhase, Participant } from '../models';
import { shuffleAssignments } from '../utils/shuffle-assignments';
import { StorageService } from './storage.service';
import { randomUUID } from '@shared/util';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly storage = inject(StorageService);

  readonly participants = signal<Participant[]>(
    this.storage.get<Participant[]>('participants') ?? []
  );
  readonly exclusions = signal<Exclusion[]>(
    this.storage.get<Exclusion[]>('exclusions') ?? []
  );
  readonly assignments = signal<Assignment[]>([]);
  readonly phase = signal<GamePhase>('setup');

  readonly canShuffle = computed(() => this.participants().length >= 3);
  readonly allRevealed = computed(
    () => this.assignments().length > 0 && this.assignments().every(a => a.revealed)
  );
  readonly unrevealed = computed(() => {
    const revealedIds = new Set(
      this.assignments().filter(a => a.revealed).map(a => a.giverId)
    );
    return this.participants().filter(p => !revealedIds.has(p.id));
  });

  constructor() {
    effect(() => {
      this.storage.set('participants', this.participants());
    });
    effect(() => {
      this.storage.set('exclusions', this.exclusions());
    });
  }

  addParticipant(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (this.participants().some(p => p.name.toLowerCase() === lower)) return;
    this.participants.update(ps => [
      ...ps,
      { id: randomUUID(), name: trimmed },
    ]);
  }

  removeParticipant(id: string): void {
    this.participants.update(ps => ps.filter(p => p.id !== id));
    this.exclusions.update(exs =>
      exs.filter(e => e.participantIdA !== id && e.participantIdB !== id)
    );
  }

  addExclusion(idA: string, idB: string): void {
    if (idA === idB) return;
    const exists = this.exclusions().some(
      e =>
        (e.participantIdA === idA && e.participantIdB === idB) ||
        (e.participantIdA === idB && e.participantIdB === idA)
    );
    if (exists) return;
    this.exclusions.update(exs => [...exs, { participantIdA: idA, participantIdB: idB }]);
  }

  removeExclusion(idA: string, idB: string): void {
    this.exclusions.update(exs =>
      exs.filter(
        e =>
          !(
            (e.participantIdA === idA && e.participantIdB === idB) ||
            (e.participantIdA === idB && e.participantIdB === idA)
          )
      )
    );
  }

  shuffle(): 'ok' | 'infeasible' {
    if (!this.canShuffle()) return 'infeasible';
    const result = shuffleAssignments(this.participants(), this.exclusions());
    if (!result) return 'infeasible';
    this.assignments.set(result);
    this.phase.set('shuffled');
    return 'ok';
  }

  revealFor(participantId: string): void {
    this.assignments.update(as =>
      as.map(a => (a.giverId === participantId ? { ...a, revealed: true } : a))
    );
  }

  reset(): void {
    this.assignments.set([]);
    this.phase.set('setup');
  }
}
