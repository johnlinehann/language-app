import type { Exercise } from './exercises';
import { exerciseItems, isGraded } from './exercises';

/**
 * Lesson queue: exercises are played in order; a missed exercise is re-queued at
 * the end (with a fresh id and reshuffled options) until it's answered correctly.
 */
export interface QueueState {
  list: Exercise[];
  idx: number;
  /** Original exercise id for each (possibly re-queued) exercise id. */
  origin: Record<string, string>;
  /** Graded originals answered correctly. */
  solved: string[];
  total: number;
  mistakes: number;
  /** itemId → missed at least once. */
  items: Record<string, boolean>;
}

let requeueCounter = 0;

export function initQueue(list: Exercise[]): QueueState {
  const graded = list.filter(isGraded);
  const items: Record<string, boolean> = {};
  for (const ex of list) for (const it of exerciseItems(ex)) items[it.id] ??= false;
  return {
    list,
    idx: 0,
    origin: Object.fromEntries(list.map((e) => [e.id, e.id])),
    solved: [],
    total: graded.length,
    mistakes: 0,
    items,
  };
}

export const current = (s: QueueState): Exercise | undefined => s.list[s.idx];
export const progress = (s: QueueState) => (s.total ? s.solved.length / s.total : 0);
export const isFinished = (s: QueueState) => s.idx >= s.list.length;

function reshuffle<T>(xs: T[]): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Record the answer to the current exercise. Does not advance. */
export function answer(s: QueueState, correct: boolean, missedItems: string[] = []): QueueState {
  const ex = current(s);
  if (!ex) return s;
  const items = { ...s.items };
  for (const id of missedItems) items[id] = true;
  if (!isGraded(ex)) return { ...s, items };
  const origin = s.origin[ex.id];
  if (correct) {
    return { ...s, items, solved: s.solved.includes(origin) ? s.solved : [...s.solved, origin] };
  }
  for (const it of exerciseItems(ex)) items[it.id] = true;
  const retry: Exercise = { ...ex, id: `${origin}~${++requeueCounter}` } as Exercise;
  if ('options' in retry) retry.options = reshuffle(retry.options);
  if (retry.kind === 'wordbank') retry.tiles = reshuffle(retry.tiles);
  return {
    ...s,
    items,
    mistakes: s.mistakes + 1,
    list: [...s.list, retry],
    origin: { ...s.origin, [retry.id]: origin },
  };
}

export const advance = (s: QueueState): QueueState => ({ ...s, idx: s.idx + 1 });
