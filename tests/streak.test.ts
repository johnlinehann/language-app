import { describe, expect, it } from 'vitest';
import { EMPTY_STREAK, MAX_FREEZES, currentStreak, earnFreeze, recordActivity } from '@/gamify/streak';
import { currentHearts, loseHeart, MAX_HEARTS, REFILL_MS } from '@/gamify/hearts';
import { addDays, dayDiff } from '@/lib/date';

const D = '2026-03-10';

describe('streak', () => {
  it('starts at 1 and grows on consecutive days', () => {
    let s = recordActivity(EMPTY_STREAK, D).state;
    expect(s.count).toBe(1);
    s = recordActivity(s, D).state; // same day: unchanged
    expect(s.count).toBe(1);
    s = recordActivity(s, addDays(D, 1)).state;
    expect(s.count).toBe(2);
    expect(s.longest).toBe(2);
  });

  it('resets after a missed day without freezes', () => {
    const s = recordActivity(recordActivity(EMPTY_STREAK, D).state, addDays(D, 2)).state;
    expect(s.count).toBe(1);
    expect(currentStreak(recordActivity(EMPTY_STREAK, D).state, addDays(D, 2))).toBe(0);
  });

  it('freezes bridge missed days and are consumed', () => {
    let s = recordActivity(EMPTY_STREAK, D).state;
    s = earnFreeze(s, D).state;
    expect(s.freezes).toBe(1);
    expect(currentStreak(s, addDays(D, 2))).toBe(1);
    const r = recordActivity(s, addDays(D, 2));
    expect(r.usedFreezes).toBe(1);
    expect(r.state.count).toBe(2);
    expect(r.state.freezes).toBe(0);
  });

  it('earns at most one freeze per day, up to the max', () => {
    let s = EMPTY_STREAK;
    s = earnFreeze(s, D).state;
    expect(earnFreeze(s, D).earned).toBe(false);
    for (let i = 1; i < 5; i++) s = earnFreeze(s, addDays(D, i)).state;
    expect(s.freezes).toBe(MAX_FREEZES);
  });

  it('date helpers cross month boundaries', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(dayDiff('2026-02-28', '2026-03-02')).toBe(2);
  });
});

describe('hearts', () => {
  it('lose one per mistake and refill over time', () => {
    let h = { count: MAX_HEARTS, since: 0 };
    h = loseHeart(h, 0);
    h = loseHeart(h, 1000);
    expect(h.count).toBe(MAX_HEARTS - 2);
    expect(currentHearts(h, REFILL_MS).count).toBe(MAX_HEARTS - 1);
    expect(currentHearts(h, 10 * REFILL_MS).count).toBe(MAX_HEARTS);
  });
});
