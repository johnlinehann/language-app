import { describe, expect, it } from 'vitest';
import {
  DAY, cardRetrievability, forgetStability, initDifficulty, initStability, newCard, nextDifficulty,
  nextInterval, retrievability, review,
} from '@/srs/fsrs';
import { CardState, type Grade } from '@/types';

const T0 = Date.UTC(2026, 0, 1);

describe('FSRS', () => {
  it('retrievability is 1 at t=0, 0.9 at t=S, and decays monotonically', () => {
    expect(retrievability(0, 5)).toBe(1);
    expect(retrievability(5, 5)).toBeCloseTo(0.9, 6);
    let prev = 1;
    for (let t = 1; t < 100; t++) {
      const r = retrievability(t, 5);
      expect(r).toBeLessThan(prev);
      prev = r;
    }
  });

  it('initial stability and difficulty are ordered by grade', () => {
    const s = ([1, 2, 3, 4] as Grade[]).map((g) => initStability(g));
    const d = ([1, 2, 3, 4] as Grade[]).map((g) => initDifficulty(g));
    expect(s).toEqual([...s].sort((a, b) => a - b));
    expect(d).toEqual([...d].sort((a, b) => b - a));
    d.forEach((x) => expect(x).toBeGreaterThanOrEqual(1));
  });

  it('first-review intervals: Again < Hard < Good < Easy', () => {
    const due = ([1, 2, 3, 4] as Grade[]).map((g) => review(newCard('x', T0), g, T0).due - T0);
    expect(due[0]).toBeLessThan(due[1]);
    expect(due[1]).toBeLessThanOrEqual(due[2]);
    expect(due[2]).toBeLessThan(due[3]);
    expect(due[0]).toBe(10 * 60_000);
  });

  it('interval at 90% retention equals stability (rounded, min 1 day)', () => {
    expect(nextInterval(10)).toBe(10);
    expect(nextInterval(0.2)).toBe(1);
  });

  it('successful reviews grow stability and push due dates further out', () => {
    let c = review(newCard('x', T0), 3, T0);
    let now = T0;
    let lastInterval = 0;
    for (let i = 0; i < 5; i++) {
      now = c.due;
      const next = review(c, 3, now);
      expect(next.stability).toBeGreaterThan(c.stability);
      const interval = next.due - now;
      expect(interval).toBeGreaterThan(lastInterval);
      lastInterval = interval;
      c = next;
    }
    expect(c.state).toBe(CardState.Review);
    expect(c.reps).toBe(6);
  });

  it('a lapse moves a review card to relearning, counts the lapse and lowers stability', () => {
    let c = review(newCard('x', T0), 3, T0);
    c = review(c, 3, c.due);
    const before = c;
    const lapsed = review(c, 1, c.due + 2 * DAY);
    expect(lapsed.state).toBe(CardState.Relearning);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.stability).toBeLessThan(before.stability);
    expect(lapsed.difficulty).toBeGreaterThan(before.difficulty);
    expect(lapsed.due - (c.due + 2 * DAY)).toBe(10 * 60_000);
  });

  it('forget stability never exceeds previous stability', () => {
    for (const s of [0.5, 3, 30, 300]) expect(forgetStability(5, s, 0.5)).toBeLessThanOrEqual(s);
  });

  it('difficulty stays within 1..10', () => {
    let d = 5;
    for (let i = 0; i < 50; i++) d = nextDifficulty(d, 1);
    expect(d).toBeLessThanOrEqual(10);
    for (let i = 0; i < 50; i++) d = nextDifficulty(d, 4);
    expect(d).toBeGreaterThanOrEqual(1);
  });

  it('does not mutate the input card; unseen cards have R=1', () => {
    const c = newCard('x', T0);
    const copy = { ...c };
    review(c, 3, T0);
    expect(c).toEqual(copy);
    expect(cardRetrievability(c, T0 + 100 * DAY)).toBe(1);
  });
});
