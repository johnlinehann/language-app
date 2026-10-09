import type { Card, Item } from '@/types';
import { cardRetrievability } from './fsrs';

export const PRACTICE_SIZE = 15;
export const MIN_PRACTICE_ITEMS = 4;

/**
 * Items for a practice session: everything due first (most overdue first), then
 * the weakest remaining items by current recall probability.
 */
export function pickPracticeItems(cards: Card[], items: Map<string, Item>, now: number, size = PRACTICE_SIZE): Item[] {
  const known = cards.filter((c) => items.has(c.itemId) && c.lastReview !== null);
  const due = known.filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
  const dueIds = new Set(due.map((c) => c.itemId));
  const weak = known
    .filter((c) => !dueIds.has(c.itemId))
    .map((c) => ({ c, r: cardRetrievability(c, now) - c.lapses * 0.05 }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.c);
  return [...due, ...weak].slice(0, size).map((c) => items.get(c.itemId)!);
}

export function countDue(cards: Card[], now: number): number {
  return cards.filter((c) => c.lastReview !== null && c.due <= now).length;
}
