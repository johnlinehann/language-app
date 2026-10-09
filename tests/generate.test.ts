import { describe, expect, it } from 'vitest';
import { generateLesson, distractors, MAX_EXERCISES, MIN_EXERCISES } from '@/lesson/generate';
import { exerciseItems, isGraded } from '@/lesson/exercises';
import { rng } from '@/lib/rng';
import { PATH, itemsBefore } from '@/data/course';
import { enPrimary } from '@/lesson/checkAnswer';

const strip = (exs: ReturnType<typeof generateLesson>) => JSON.stringify(exs.map(({ id: _id, ...rest }) => rest));

describe('generateLesson', () => {
  const lessons = PATH.filter((n) => !n.checkpoint);

  it.each(lessons.map((n) => [n.lesson.lesson, n] as const))('%s has 10–15 graded exercises covering every item', (_, n) => {
    const exs = generateLesson(n.lesson.items, { seed: 1, pool: itemsBefore(n.order), introduce: true });
    const graded = exs.filter(isGraded);
    expect(graded.length).toBeGreaterThanOrEqual(MIN_EXERCISES);
    expect(graded.length).toBeLessThanOrEqual(MAX_EXERCISES);
    const covered = new Set(graded.flatMap(exerciseItems).map((i) => i.id));
    for (const it of n.lesson.items) covered.has(it.id) || expect.fail(`${it.id} not practised`);
    // every new item is introduced exactly once
    const intros = exs.filter((e) => e.kind === 'intro');
    expect(intros.length).toBe(n.lesson.items.length);
  });

  it('is deterministic for a seed', () => {
    const n = lessons[0];
    const a = generateLesson(n.lesson.items, { seed: 42, introduce: true });
    const b = generateLesson(n.lesson.items, { seed: 42, introduce: true });
    const c = generateLesson(n.lesson.items, { seed: 43, introduce: true });
    expect(strip(a)).toBe(strip(b));
    expect(strip(a)).not.toBe(strip(c));
  });

  it('match exercises have 5 distinct pairs', () => {
    for (const n of lessons) {
      const exs = generateLesson(n.lesson.items, { seed: 7, pool: itemsBefore(n.order), introduce: true });
      for (const ex of exs) {
        if (ex.kind !== 'match') continue;
        expect(ex.items).toHaveLength(5);
        expect(new Set(ex.items.map((i) => i.jp)).size).toBe(5);
        expect(new Set(ex.items.map((i) => enPrimary(i))).size).toBe(5);
      }
    }
  });

  it('multiple-choice options contain the answer once and no look-alike distractors', () => {
    for (const n of PATH) {
      const exs = generateLesson(n.lesson.items, { seed: 3, pool: itemsBefore(n.order), introduce: !n.checkpoint });
      for (const ex of exs) {
        if (!('options' in ex)) continue;
        expect(ex.options.filter((o) => o.id === ex.item.id)).toHaveLength(1);
        expect(ex.options.length).toBeGreaterThanOrEqual(2);
        const jps = ex.options.map((o) => o.jp);
        expect(new Set(jps).size).toBe(jps.length);
      }
    }
  });

  it('word bank tiles contain the full answer', () => {
    for (const n of lessons) {
      const exs = generateLesson(n.lesson.items, { seed: 5, pool: itemsBefore(n.order), introduce: true });
      for (const ex of exs) {
        if (ex.kind !== 'wordbank') continue;
        const tiles = [...ex.tiles];
        for (const t of ex.answer) {
          const i = tiles.indexOf(t);
          expect(i).toBeGreaterThanOrEqual(0);
          tiles.splice(i, 1);
        }
        expect(tiles.length).toBeGreaterThanOrEqual(1); // has distractors
      }
    }
  });

  it('checkpoints and practice produce 15 exercises without intros', () => {
    const cp = PATH.find((n) => n.checkpoint)!;
    const exs = generateLesson(cp.lesson.items, { seed: 9, pool: itemsBefore(cp.order), introduce: false });
    expect(exs.filter((e) => e.kind === 'intro')).toHaveLength(0);
    expect(exs.length).toBe(MAX_EXERCISES);
  });

  it('distractors never equal the answer', () => {
    const items = PATH.flatMap((n) => n.lesson.items);
    const r = rng(1);
    for (const it of items.slice(0, 80)) {
      for (const d of distractors(it, items, 3, 'jp', r)) {
        expect(d.id).not.toBe(it.id);
        expect(d.jp).not.toBe(it.jp);
      }
    }
  });
});
