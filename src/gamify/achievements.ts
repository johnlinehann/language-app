export interface Stats {
  totalXp: number;
  streak: number;
  longestStreak: number;
  lessonsCompleted: number;
  perfectLessons: number;
  practiceSessions: number;
  checkpoints: number;
  itemsLearned: number;
  completed: Set<string>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  test: (s: Stats) => boolean;
}

const unitDone = (s: Stats, ...units: string[]) => units.every((u) => s.completed.has(`${u}-checkpoint`));

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-lesson', title: 'First steps', description: 'Finish your first lesson.', icon: '🌱', test: (s) => s.lessonsCompleted >= 1 },
  { id: 'perfect', title: 'Flawless', description: 'Finish a lesson with no mistakes.', icon: '💎', test: (s) => s.perfectLessons >= 1 },
  { id: 'hiragana', title: 'Hiragana hero', description: 'Pass both hiragana checkpoints.', icon: 'あ', test: (s) => unitDone(s, 'u00a', 'u00b') },
  { id: 'katakana', title: 'Katakana champion', description: 'Pass both katakana checkpoints.', icon: 'カ', test: (s) => unitDone(s, 'u01a', 'u01b') },
  { id: 'checkpoint', title: 'Gatekeeper', description: 'Pass any checkpoint.', icon: '⛩️', test: (s) => s.checkpoints >= 1 },
  { id: 'practice', title: 'Keep it fresh', description: 'Finish a practice session.', icon: '🔁', test: (s) => s.practiceSessions >= 1 },
  { id: 'practice-10', title: 'Diligent', description: 'Finish 10 practice sessions.', icon: '📚', test: (s) => s.practiceSessions >= 10 },
  { id: 'streak-3', title: 'Warming up', description: 'Reach a 3-day streak.', icon: '🔥', test: (s) => s.longestStreak >= 3 },
  { id: 'streak-7', title: 'One week', description: 'Reach a 7-day streak.', icon: '📅', test: (s) => s.longestStreak >= 7 },
  { id: 'streak-30', title: 'Habit formed', description: 'Reach a 30-day streak.', icon: '🏯', test: (s) => s.longestStreak >= 30 },
  { id: 'xp-100', title: 'Century', description: 'Earn 100 XP.', icon: '⭐', test: (s) => s.totalXp >= 100 },
  { id: 'xp-1000', title: 'Thousand cranes', description: 'Earn 1,000 XP.', icon: '🕊️', test: (s) => s.totalXp >= 1000 },
  { id: 'items-50', title: 'Vocabulary', description: 'Learn 50 items.', icon: '🧠', test: (s) => s.itemsLearned >= 50 },
  { id: 'items-150', title: 'Word hoard', description: 'Learn 150 items.', icon: '🏮', test: (s) => s.itemsLearned >= 150 },
];

/** Achievements newly satisfied by `stats` that aren't in `unlocked` yet. */
export function newlyUnlocked(stats: Stats, unlocked: Record<string, string>): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !unlocked[a.id] && a.test(stats));
}
