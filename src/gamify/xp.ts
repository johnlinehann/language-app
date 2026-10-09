export type SessionKind = 'lesson' | 'checkpoint' | 'practice';

export const BASE_XP: Record<SessionKind, number> = { lesson: 10, checkpoint: 20, practice: 10 };
export const PERFECT_BONUS = 5;

export function sessionXp(kind: SessionKind, mistakes: number): number {
  return BASE_XP[kind] + (mistakes === 0 ? PERFECT_BONUS : 0);
}

export const DAILY_GOALS = [
  { xp: 10, label: 'Casual' },
  { xp: 20, label: 'Regular' },
  { xp: 30, label: 'Serious' },
  { xp: 50, label: 'Intense' },
] as const;
