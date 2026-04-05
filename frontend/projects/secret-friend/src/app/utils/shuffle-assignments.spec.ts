import { shuffleAssignments } from './shuffle-assignments';
import { Participant, Exclusion } from '../models';

const makeParticipants = (names: string[]): Participant[] =>
  names.map((name, i) => ({ id: `p${i + 1}`, name }));

describe('shuffleAssignments', () => {
  // SF-27: no self-assignment (derangement)
  it('SF-27: never assigns a participant to themselves (1000 runs)', () => {
    const participants = makeParticipants(['Alice', 'Bob', 'Charlie', 'Diana']);
    for (let i = 0; i < 1000; i++) {
      const result = shuffleAssignments(participants, []);
      expect(result).not.toBeNull();
      for (const assignment of result!) {
        expect(assignment.giverId).not.toBe(assignment.receiverId);
      }
    }
  });

  // SF-28: exclusions respected
  it('SF-28: respects exclusions (100 runs)', () => {
    const participants = makeParticipants(['Alice', 'Bob', 'Charlie', 'Diana']);
    const exclusions: Exclusion[] = [{ participantIdA: 'p1', participantIdB: 'p2' }];
    for (let i = 0; i < 100; i++) {
      const result = shuffleAssignments(participants, exclusions);
      expect(result).not.toBeNull();
      for (const assignment of result!) {
        const isViolation =
          (assignment.giverId === 'p1' && assignment.receiverId === 'p2') ||
          (assignment.giverId === 'p2' && assignment.receiverId === 'p1');
        expect(isViolation).toBe(false);
      }
    }
  });

  // SF-29: bijection — each participant appears exactly once as giver and once as receiver
  it('SF-29: every participant appears exactly once as giver and once as receiver', () => {
    const participants = makeParticipants(['Alice', 'Bob', 'Charlie', 'Diana']);
    const result = shuffleAssignments(participants, []);
    expect(result).not.toBeNull();
    const givers = result!.map((a: { giverId: string }) => a.giverId);
    const receivers = result!.map((a: { receiverId: string }) => a.receiverId);
    const ids = participants.map(p => p.id);
    expect(givers.sort()).toEqual(ids.sort());
    expect(receivers.sort()).toEqual(ids.sort());
  });

  // SF-30: returns null when infeasible (2 participants with mutual exclusion)
  it('SF-30: returns null when infeasible — 2 participants with both exclusions', () => {
    const participants = makeParticipants(['Alice', 'Bob']);
    const exclusions: Exclusion[] = [{ participantIdA: 'p1', participantIdB: 'p2' }];
    const result = shuffleAssignments(participants, exclusions);
    expect(result).toBeNull();
  });

  // SF-31: returns null when all non-self slots excluded (3 participants, all pairs excluded)
  it('SF-31: returns null when all non-self slots are excluded', () => {
    const participants = makeParticipants(['Alice', 'Bob', 'Charlie']);
    const exclusions: Exclusion[] = [
      { participantIdA: 'p1', participantIdB: 'p2' },
      { participantIdA: 'p1', participantIdB: 'p3' },
      { participantIdA: 'p2', participantIdB: 'p3' },
    ];
    const result = shuffleAssignments(participants, exclusions);
    expect(result).toBeNull();
  });

  // TRIANGULATE: edge cases
  it('TRIANGULATE: empty participants returns [] (not null)', () => {
    const result = shuffleAssignments([], []);
    expect(result).toEqual([]);
  });

  it('TRIANGULATE: single participant returns null (cannot assign to self)', () => {
    const participants = makeParticipants(['Alice']);
    const result = shuffleAssignments(participants, []);
    expect(result).toBeNull();
  });

  it('TRIANGULATE: two participants with no exclusions — each gets the other', () => {
    const participants = makeParticipants(['Alice', 'Bob']);
    const result = shuffleAssignments(participants, []);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(2);
    const aliceAssignment = result!.find(a => a.giverId === 'p1');
    const bobAssignment = result!.find(a => a.giverId === 'p2');
    expect(aliceAssignment!.receiverId).toBe('p2');
    expect(bobAssignment!.receiverId).toBe('p1');
  });

  it('TRIANGULATE: 10 participants with no exclusions always returns a valid non-null result', () => {
    const participants = makeParticipants(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
    for (let i = 0; i < 50; i++) {
      const result = shuffleAssignments(participants, []);
      expect(result).not.toBeNull();
      expect(result!.length).toBe(10);
      for (const assignment of result!) {
        expect(assignment.giverId).not.toBe(assignment.receiverId);
      }
    }
  });
});
