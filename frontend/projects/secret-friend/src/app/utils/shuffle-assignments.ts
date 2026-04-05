import { Assignment, Exclusion, Participant } from '../models';

export function shuffleAssignments(
  participants: Participant[],
  exclusions: Exclusion[]
): Assignment[] | null {
  if (participants.length === 0) return [];

  const MAX_ATTEMPTS = 100;

  // Build exclusion set (symmetric + self)
  const excluded = new Map<string, Set<string>>();
  for (const p of participants) {
    excluded.set(p.id, new Set([p.id])); // self-exclusion
  }
  for (const ex of exclusions) {
    excluded.get(ex.participantIdA)?.add(ex.participantIdB);
    excluded.get(ex.participantIdB)?.add(ex.participantIdA);
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const receivers = [...participants.map(p => p.id)];
    // Fisher-Yates shuffle
    for (let i = receivers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
    }
    // Validate
    const valid = participants.every(
      (p, i) => !excluded.get(p.id)?.has(receivers[i])
    );
    if (valid) {
      return participants.map((p, i) => ({
        giverId: p.id,
        receiverId: receivers[i],
        revealed: false,
      }));
    }
  }

  return null;
}
