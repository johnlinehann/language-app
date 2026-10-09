import { db, getMeta, setMeta } from './db';
import { newCard, review } from '@/srs/fsrs';
import { localDay } from '@/lib/date';
import { EMPTY_STREAK, currentStreak, earnFreeze, recordActivity, type StreakState } from '@/gamify/streak';
import { sessionXp, type SessionKind } from '@/gamify/xp';
import { ACHIEVEMENTS, newlyUnlocked, type Achievement, type Stats } from '@/gamify/achievements';
import { FULL_HEARTS, MAX_HEARTS, currentHearts, loseHeart, type HeartsState } from '@/gamify/hearts';
import { CardState, type Grade } from '@/types';

export interface Counters {
  perfectLessons: number;
  practiceSessions: number;
}

export interface SessionResult {
  kind: SessionKind;
  lessonId: string;
  /** itemId → true when the learner missed it at least once. */
  items: Map<string, boolean>;
  graded: number;
  mistakes: number;
}

export interface SessionSummary {
  xp: number;
  accuracy: number;
  streak: number;
  streakExtended: boolean;
  usedFreezes: number;
  freezeEarned: boolean;
  todayXp: number;
  goalReached: boolean;
  achievements: Achievement[];
}

export async function getStreak(): Promise<StreakState> {
  return getMeta('streak', EMPTY_STREAK);
}

export async function computeStats(): Promise<Stats> {
  const [lessons, xpRows, streak, counters, learned] = await Promise.all([
    db.lessons.toArray(),
    db.xp.toArray(),
    getStreak(),
    getMeta<Counters>('counters', { perfectLessons: 0, practiceSessions: 0 }),
    db.cards.where('state').notEqual(CardState.New).count(),
  ]);
  const completed = new Set(lessons.map((l) => l.lessonId));
  return {
    totalXp: xpRows.reduce((a, r) => a + r.xp, 0),
    streak: currentStreak(streak, localDay()),
    longestStreak: streak.longest,
    lessonsCompleted: lessons.filter((l) => !l.lessonId.endsWith('-checkpoint')).length,
    checkpoints: lessons.filter((l) => l.lessonId.endsWith('-checkpoint')).length,
    perfectLessons: counters.perfectLessons,
    practiceSessions: counters.practiceSessions,
    itemsLearned: learned,
    completed,
  };
}

/** Persist a finished lesson/checkpoint/practice: SRS, XP, streak, achievements. */
export async function finishSession(r: SessionResult, now = Date.now()): Promise<SessionSummary> {
  const today = localDay(now);
  const xp = sessionXp(r.kind, r.mistakes);
  const accuracy = r.graded ? Math.max(0, (r.graded - r.mistakes) / r.graded) : 1;

  const summary = await db.transaction('rw', db.cards, db.lessons, db.xp, db.meta, async () => {
    // Spaced repetition: one review per item per session.
    const ids = [...r.items.keys()];
    const existing = await db.cards.bulkGet(ids);
    const updated = ids.map((id, i) => {
      const grade: Grade = r.items.get(id) ? 1 : 3;
      return review(existing[i] ?? newCard(id, now), grade, now);
    });
    await db.cards.bulkPut(updated);

    if (r.kind !== 'practice') {
      const prev = await db.lessons.get(r.lessonId);
      await db.lessons.put({
        lessonId: r.lessonId,
        firstCompletedAt: prev?.firstCompletedAt ?? now,
        lastCompletedAt: now,
        bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, accuracy),
        timesCompleted: (prev?.timesCompleted ?? 0) + 1,
      });
    }

    await db.xp.add({ date: today, at: now, xp, source: r.lessonId });

    let streak = await getStreak();
    const act = recordActivity(streak, today);
    streak = act.state;
    let freezeEarned = false;
    if (r.kind === 'practice') {
      const f = earnFreeze(streak, today);
      streak = f.state;
      freezeEarned = f.earned;
    }
    await setMeta('streak', streak);

    const counters = await getMeta<Counters>('counters', { perfectLessons: 0, practiceSessions: 0 });
    if (r.mistakes === 0 && r.kind !== 'practice') counters.perfectLessons++;
    if (r.kind === 'practice') counters.practiceSessions++;
    await setMeta('counters', counters);

    if (r.kind === 'practice') await setMeta<HeartsState>('hearts', FULL_HEARTS(now));

    const goal = (await getMeta<{ dailyGoal?: number }>('settings', {})).dailyGoal ?? 20;
    const todayRows = await db.xp.where('date').equals(today).toArray();
    const todayXp = todayRows.reduce((a, x) => a + x.xp, 0);
    return {
      xp,
      accuracy,
      streak: streak.count,
      streakExtended: act.extended,
      usedFreezes: act.usedFreezes,
      freezeEarned,
      todayXp,
      goalReached: todayXp >= goal && todayXp - xp < goal,
      achievements: [] as Achievement[],
    };
  });

  const unlocked = await getMeta<Record<string, string>>('achievements', {});
  const fresh = newlyUnlocked(await computeStats(), unlocked);
  if (fresh.length) {
    for (const a of fresh) unlocked[a.id] = new Date(now).toISOString();
    await setMeta('achievements', unlocked);
  }
  return { ...summary, achievements: fresh };
}

export async function getHearts(now = Date.now()): Promise<HeartsState> {
  return currentHearts(await getMeta<HeartsState>('hearts', FULL_HEARTS(now)), now);
}

export async function spendHeart(now = Date.now()): Promise<HeartsState> {
  const h = loseHeart(await getHearts(now), now);
  await setMeta('hearts', h);
  return h;
}

export { MAX_HEARTS, ACHIEVEMENTS };
