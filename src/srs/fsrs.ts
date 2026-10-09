/**
 * FSRS-5 (Free Spaced Repetition Scheduler) — a compact, dependency-free port of the
 * open-source algorithm by Jarrett Ye et al. (https://github.com/open-spaced-repetition).
 * Day-granular: same-day reviews use the short-term stability formula.
 */
import { CardState, type Card, type Grade } from '@/types';

export const DEFAULT_W: readonly number[] = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11,
  0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
];

export const DECAY = -0.5;
export const FACTOR = 19 / 81; // makes R(t = S) = 0.9
export const DAY = 86_400_000;

export interface FsrsParams {
  w: readonly number[];
  requestRetention: number;
  maximumInterval: number;
  /** Minutes until a forgotten card is due again. */
  relearnMinutes: number;
}

export const DEFAULT_PARAMS: FsrsParams = {
  w: DEFAULT_W,
  requestRetention: 0.9,
  maximumInterval: 36500,
  relearnMinutes: 10,
};

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Probability of recall after `elapsedDays` for a memory of stability `s`. */
export function retrievability(elapsedDays: number, s: number): number {
  if (s <= 0) return 0;
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / s, DECAY);
}

export function initStability(g: Grade, w = DEFAULT_W): number {
  return Math.max(w[g - 1], 0.1);
}

export function initDifficulty(g: Grade, w = DEFAULT_W): number {
  return clamp(w[4] - Math.exp(w[5] * (g - 1)) + 1, 1, 10);
}

export function nextDifficulty(d: number, g: Grade, w = DEFAULT_W): number {
  const delta = -w[6] * (g - 3);
  const damped = d + (delta * (10 - d)) / 9; // linear damping
  const reverted = w[7] * initDifficulty(4, w) + (1 - w[7]) * damped; // mean reversion
  return clamp(reverted, 1, 10);
}

export function recallStability(d: number, s: number, r: number, g: Grade, w = DEFAULT_W): number {
  const hardPenalty = g === 2 ? w[15] : 1;
  const easyBonus = g === 4 ? w[16] : 1;
  return (
    s *
    (1 +
      Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp(w[10] * (1 - r)) - 1) * hardPenalty * easyBonus)
  );
}

export function forgetStability(d: number, s: number, r: number, w = DEFAULT_W): number {
  const sf = w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r));
  return Math.min(sf, s);
}

export function shortTermStability(s: number, g: Grade, w = DEFAULT_W): number {
  return s * Math.exp(w[17] * (g - 3 + w[18]));
}

/** Days until R drops to `requestRetention`. */
export function nextInterval(s: number, p: FsrsParams = DEFAULT_PARAMS): number {
  const days = (s / FACTOR) * (Math.pow(p.requestRetention, 1 / DECAY) - 1);
  return clamp(Math.round(days), 1, p.maximumInterval);
}

export function newCard(itemId: string, now: number): Card {
  return { itemId, due: now, stability: 0, difficulty: 0, reps: 0, lapses: 0, state: CardState.New, lastReview: null };
}

/** Apply one review with grade `g` at time `now`; returns the updated card (input is not mutated). */
export function review(card: Card, g: Grade, now: number, p: FsrsParams = DEFAULT_PARAMS): Card {
  const w = p.w;
  const next: Card = { ...card, reps: card.reps + 1, lastReview: now };

  if (card.state === CardState.New || card.lastReview === null) {
    next.stability = initStability(g, w);
    next.difficulty = initDifficulty(g, w);
  } else {
    const elapsed = (now - card.lastReview) / DAY;
    const r = retrievability(elapsed, card.stability);
    next.difficulty = nextDifficulty(card.difficulty, g, w);
    if (elapsed < 1) next.stability = shortTermStability(card.stability, g, w);
    else if (g === 1) next.stability = forgetStability(card.difficulty, card.stability, r, w);
    else next.stability = recallStability(card.difficulty, card.stability, r, g, w);
  }

  if (g === 1) {
    if (card.state === CardState.Review) next.lapses = card.lapses + 1;
    next.state = card.state === CardState.New || card.state === CardState.Learning ? CardState.Learning : CardState.Relearning;
    next.due = now + p.relearnMinutes * 60_000;
  } else {
    next.state = CardState.Review;
    next.due = now + nextInterval(next.stability, p) * DAY;
  }
  return next;
}

/** Current probability of recall for a card (1 for unseen cards, which are never "weak"). */
export function cardRetrievability(card: Card, now: number): number {
  if (card.lastReview === null) return 1;
  return retrievability((now - card.lastReview) / DAY, card.stability);
}
