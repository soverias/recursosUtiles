import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { StorageService } from './storage.service';

describe('GameService', () => {
  let service: GameService;
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [GameService, StorageService],
    });
    storage = TestBed.inject(StorageService);
    service = TestBed.inject(GameService);
  });

  // ---- Participants CRUD (T-03.1) ----

  it('addParticipant adds a participant with a non-empty id and correct name', () => {
    service.addParticipant('Alice');
    expect(service.participants().length).toBe(1);
    expect(service.participants()[0].name).toBe('Alice');
    expect(service.participants()[0].id).toBeTruthy();
  });

  it('addParticipant with empty string does nothing', () => {
    service.addParticipant('');
    expect(service.participants().length).toBe(0);
  });

  it('addParticipant rejects duplicate name (case-insensitive)', () => {
    service.addParticipant('Alice');
    service.addParticipant('alice');
    expect(service.participants().length).toBe(1);
  });

  it('addParticipant allows different names', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    expect(service.participants().length).toBe(2);
  });

  it('removeParticipant removes the participant by id', () => {
    service.addParticipant('Alice');
    const id = service.participants()[0].id;
    service.removeParticipant(id);
    expect(service.participants().length).toBe(0);
  });

  it('removeParticipant also removes exclusions involving that participant', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    const idA = service.participants()[0].id;
    const idB = service.participants()[1].id;
    service.addExclusion(idA, idB);
    expect(service.exclusions().length).toBe(1);
    service.removeParticipant(idA);
    expect(service.exclusions().length).toBe(0);
  });

  // ---- Exclusions CRUD (T-03.3) ----

  it('addExclusion adds an exclusion', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    const idA = service.participants()[0].id;
    const idB = service.participants()[1].id;
    service.addExclusion(idA, idB);
    expect(service.exclusions().length).toBe(1);
  });

  it('addExclusion with same id rejects self-exclusion', () => {
    service.addParticipant('Alice');
    const id = service.participants()[0].id;
    service.addExclusion(id, id);
    expect(service.exclusions().length).toBe(0);
  });

  it('addExclusion duplicate (same pair) is rejected', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    const idA = service.participants()[0].id;
    const idB = service.participants()[1].id;
    service.addExclusion(idA, idB);
    service.addExclusion(idA, idB);
    expect(service.exclusions().length).toBe(1);
  });

  it('addExclusion reverse duplicate is also rejected', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    const idA = service.participants()[0].id;
    const idB = service.participants()[1].id;
    service.addExclusion(idA, idB);
    service.addExclusion(idB, idA);
    expect(service.exclusions().length).toBe(1);
  });

  it('removeExclusion removes an exclusion by pair', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    const idA = service.participants()[0].id;
    const idB = service.participants()[1].id;
    service.addExclusion(idA, idB);
    service.removeExclusion(idA, idB);
    expect(service.exclusions().length).toBe(0);
  });

  // ---- Shuffle + phase transitions (T-03.4) ----

  it('shuffle with 3+ participants returns ok, sets assignments and phase to shuffled', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    service.addParticipant('Charlie');
    const result = service.shuffle();
    expect(result).toBe('ok');
    expect(service.assignments().length).toBe(3);
    expect(service.phase()).toBe('shuffled');
  });

  it('shuffle with 2 participants returns infeasible', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    const result = service.shuffle();
    expect(result).toBe('infeasible');
    expect(service.assignments().length).toBe(0);
  });

  it('canShuffle is true with 3 participants', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    service.addParticipant('Charlie');
    expect(service.canShuffle()).toBe(true);
  });

  it('canShuffle is false with 2 participants', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    expect(service.canShuffle()).toBe(false);
  });

  // ---- Reveal flow + computed (T-03.5) ----

  it('after shuffle, unrevealed contains all participants', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    service.addParticipant('Charlie');
    service.shuffle();
    expect(service.unrevealed().length).toBe(3);
  });

  it('revealFor marks that assignment as revealed', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    service.addParticipant('Charlie');
    service.shuffle();
    const firstGiverId = service.assignments()[0].giverId;
    service.revealFor(firstGiverId);
    const assignment = service.assignments().find(a => a.giverId === firstGiverId);
    expect(assignment!.revealed).toBe(true);
  });

  it('after revealing, participant disappears from unrevealed', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    service.addParticipant('Charlie');
    service.shuffle();
    const firstGiverId = service.assignments()[0].giverId;
    service.revealFor(firstGiverId);
    const unrevealedIds = service.unrevealed().map(p => p.id);
    expect(unrevealedIds).not.toContain(firstGiverId);
  });

  it('allRevealed is false until all are revealed', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    service.addParticipant('Charlie');
    service.shuffle();
    service.revealFor(service.assignments()[0].giverId);
    expect(service.allRevealed()).toBe(false);
  });

  it('allRevealed is true when all assignments are revealed', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    service.addParticipant('Charlie');
    service.shuffle();
    for (const a of service.assignments()) {
      service.revealFor(a.giverId);
    }
    expect(service.allRevealed()).toBe(true);
  });

  it('allRevealed is false when assignments is empty', () => {
    expect(service.allRevealed()).toBe(false);
  });

  // ---- Persistence (T-03.6) ----

  it('after addParticipant, storage contains the participant', () => {
    service.addParticipant('Alice');
    TestBed.flushEffects();
    const stored = storage.get<{ name: string }[]>('participants');
    expect(stored).not.toBeNull();
    expect(stored![0].name).toBe('Alice');
  });

  it('after addExclusion, storage reflects the exclusion', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    TestBed.flushEffects();
    const idA = service.participants()[0].id;
    const idB = service.participants()[1].id;
    service.addExclusion(idA, idB);
    TestBed.flushEffects();
    const stored = storage.get<unknown[]>('exclusions');
    expect(stored).not.toBeNull();
    expect(stored!.length).toBe(1);
  });

  it('assignments are NOT persisted to localStorage after shuffle', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    service.addParticipant('Charlie');
    service.shuffle();
    const stored = storage.get<unknown>('assignments');
    expect(stored).toBeNull();
  });

  it('reset clears assignments and phase but leaves participants and exclusions', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    service.addParticipant('Charlie');
    service.addExclusion(service.participants()[0].id, service.participants()[1].id);
    service.shuffle();
    service.reset();
    expect(service.assignments().length).toBe(0);
    expect(service.phase()).toBe('setup');
    expect(service.participants().length).toBe(3);
    expect(service.exclusions().length).toBe(1);
  });

  // ---- TRIANGULATE edge cases (T-03.7) ----

  it('TRIANGULATE: canShuffle is false when 0 participants', () => {
    expect(service.canShuffle()).toBe(false);
  });

  it('TRIANGULATE: shuffle when canShuffle is false returns infeasible and is a no-op', () => {
    service.addParticipant('Alice');
    service.addParticipant('Bob');
    expect(service.canShuffle()).toBe(false);
    const result = service.shuffle();
    expect(result).toBe('infeasible');
    expect(service.assignments().length).toBe(0);
    expect(service.phase()).toBe('setup');
  });

  it('TRIANGULATE: removeParticipant on nonexistent id is a no-op', () => {
    service.addParticipant('Alice');
    service.removeParticipant('nonexistent-id');
    expect(service.participants().length).toBe(1);
  });

  it('TRIANGULATE: allRevealed is false when assignments is empty', () => {
    expect(service.allRevealed()).toBe(false);
  });
});
