import { dayDiff } from '@/lib/date';

export const MAX_FREEZES = 2;

export interface StreakState {
  count: number;
  longest: number;
  /** Last day with activity (YYYY-MM-DD). */
  last: string | null;
  freezes: number;
  /** Day a freeze was last earned, so practice earns at most one per day. */
  freezeEarnedOn: string | null;
}

export const EMPTY_STREAK: StreakState = { count: 0, longest: 0, last: null, freezes: 0, freezeEarnedOn: null };

/** Days missed between the last activity and today that freezes would have to cover. */
const missedDays = (s: StreakState, today: string) => (s.last ? dayDiff(s.last, today) - 1 : 0);

/** Streak as it should be displayed today: 0 if it was broken and freezes can't cover the gap. */
export function currentStreak(s: StreakState, today: string): number {
  if (!s.last) return 0;
  const missed = missedDays(s, today);
  return missed <= s.freezes ? s.count : 0;
}

/** Record activity today. Uses freezes to bridge missed days when possible. */
export function recordActivity(s: StreakState, today: string): { state: StreakState; usedFreezes: number; extended: boolean } {
  if (s.last === today) return { state: s, usedFreezes: 0, extended: false };
  const missed = missedDays(s, today);
  let count: number;
  let usedFreezes = 0;
  if (!s.last || missed < 0) count = 1;
  else if (missed === 0) count = s.count + 1;
  else if (missed <= s.freezes) {
    usedFreezes = missed;
    count = s.count + 1;
  } else count = 1;
  const state = { ...s, count, last: today, freezes: s.freezes - usedFreezes, longest: Math.max(s.longest, count) };
  return { state, usedFreezes, extended: true };
}

/** Practice sessions earn a streak freeze (one per day, up to MAX_FREEZES). */
export function earnFreeze(s: StreakState, today: string): { state: StreakState; earned: boolean } {
  if (s.freezes >= MAX_FREEZES || s.freezeEarnedOn === today) return { state: s, earned: false };
  return { state: { ...s, freezes: s.freezes + 1, freezeEarnedOn: today }, earned: true };
}
