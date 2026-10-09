import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { finishSession, computeStats, getHearts, spendHeart } from '@/db/progress';
import { pickPracticeItems } from '@/srs/review';
import { ITEMS } from '@/data/course';
import { DAY } from '@/srs/fsrs';
import { CardState } from '@/types';

const T0 = new Date(2026, 4, 1, 12).getTime();

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const session = (lessonId: string, items: Record<string, boolean>, kind: 'lesson' | 'practice' | 'checkpoint' = 'lesson') => ({
  kind,
  lessonId,
  items: new Map(Object.entries(items)),
  graded: 12,
  mistakes: Object.values(items).filter(Boolean).length,
});

describe('finishSession', () => {
  it('records the lesson, schedules cards and awards XP and streak', async () => {
    const s = await finishSession(session('u00a-l1', { 'h.a': false, 'h.i': true }), T0);
    expect(s.xp).toBe(10);
    expect(s.streak).toBe(1);
    expect(s.achievements.map((a) => a.id)).toContain('first-lesson');
    const a = await db.cards.get('h.a');
    const i = await db.cards.get('h.i');
    expect(a!.state).toBe(CardState.Review);
    expect(i!.state).toBe(CardState.Learning); // missed → Again → short relearn
    expect(i!.due).toBeLessThan(a!.due);
    expect(await db.lessons.get('u00a-l1')).toBeTruthy();
  });

  it('perfect lessons get a bonus; practice earns a freeze and refills hearts', async () => {
    const s = await finishSession(session('u00a-l1', { 'h.a': false }), T0);
    expect(s.xp).toBe(15);
    await spendHeart(T0);
    expect((await getHearts(T0)).count).toBe(4);
    const p = await finishSession(session('practice', { 'h.a': false }, 'practice'), T0 + 1000);
    expect(p.freezeEarned).toBe(true);
    expect((await getHearts(T0 + 2000)).count).toBe(5);
    expect(await db.lessons.get('practice')).toBeUndefined();
  });

  it('streak grows across days and stats aggregate', async () => {
    await finishSession(session('u00a-l1', { 'h.a': false }), T0);
    const s2 = await finishSession(session('u00a-l2', { 'h.ka': false }), T0 + DAY);
    expect(s2.streak).toBe(2);
    const stats = await computeStats();
    expect(stats.lessonsCompleted).toBe(2);
    expect(stats.itemsLearned).toBe(2);
  });

  it('practice picks due items first, then weakest', async () => {
    await finishSession(session('u00a-l1', { 'h.a': false, 'h.i': false, 'h.u': true, 'h.e': false }), T0);
    const cards = await db.cards.toArray();
    const items = pickPracticeItems(cards, ITEMS, T0 + 60 * 60_000);
    expect(items[0].id).toBe('h.u'); // the missed one is due within the hour
    expect(items).toHaveLength(4);
  });
});
