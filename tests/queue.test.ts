import { describe, expect, it } from 'vitest';
import { advance, answer, current, initQueue, isFinished, progress } from '@/lesson/queue';
import { generateLesson } from '@/lesson/generate';
import { PATH } from '@/data/course';

const lesson = PATH[0].lesson;

describe('lesson queue', () => {
  it('re-queues missed exercises at the end until answered correctly', () => {
    let s = initQueue(generateLesson(lesson.items, { seed: 1, introduce: false }));
    const n = s.list.length;
    const first = current(s)!;
    s = advance(answer(s, false));
    expect(s.list).toHaveLength(n + 1);
    expect(s.mistakes).toBe(1);
    expect(s.list[n].kind).toBe(first.kind);
    expect(s.list[n].id).not.toBe(first.id);
    // answer everything else correctly
    while (!isFinished(s)) s = advance(answer(s, true));
    expect(progress(s)).toBe(1);
    expect(s.solved).toHaveLength(s.total);
    const missedIds = Object.entries(s.items).filter(([, m]) => m).map(([id]) => id);
    expect(missedIds.length).toBeGreaterThan(0);
  });

  it('intro cards do not count towards progress', () => {
    let s = initQueue(generateLesson(lesson.items, { seed: 2, introduce: true }));
    expect(current(s)!.kind).toBe('intro');
    s = advance(answer(s, true));
    expect(progress(s)).toBe(0);
  });

  it('perfect run makes no mistakes and marks no items', () => {
    let s = initQueue(generateLesson(lesson.items, { seed: 3, introduce: true }));
    while (!isFinished(s)) s = advance(answer(s, true));
    expect(s.mistakes).toBe(0);
    expect(Object.values(s.items).every((m) => !m)).toBe(true);
  });
});
