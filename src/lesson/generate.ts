import type { Item } from '@/types';
import { rng, type Rng } from '@/lib/rng';
import { parseToken } from '@/lib/furigana';
import { enPrimary } from './checkAnswer';
import type { Exercise, ExerciseKind } from './exercises';

export const MIN_EXERCISES = 10;
export const MAX_EXERCISES = 15;
export const MATCH_PAIRS = 5;

export interface GenerateOptions {
  seed?: number;
  /** Items the learner has seen before; used for distractors and match pairs. */
  pool?: Item[];
  /** Show intro cards for the lesson items (true for new lessons, false for checkpoints/practice). */
  introduce?: boolean;
}

const isKana = (it: Item) => it.type === 'kana';
const hasTokens = (it: Item) => (it.tokens?.length ?? 0) > 1;
const script = (it: Item) => it.id.split('.')[0];

/** Display key used to keep options visually distinct. */
const key = (it: Item, side: 'jp' | 'en') =>
  side === 'jp' ? it.jp : isKana(it) ? it.romaji : enPrimary(it).toLowerCase();

/** Pick up to n distractors that look different from the answer on the given side. */
export function distractors(item: Item, pool: Item[], n: number, side: 'jp' | 'en', r: Rng): Item[] {
  const sameFamily = (o: Item) =>
    isKana(item) ? isKana(o) && script(o) === script(item) : !isKana(o) && (o.type === 'sentence') === (item.type === 'sentence');
  const seen = new Set([key(item, side), key(item, side === 'jp' ? 'en' : 'jp')]);
  const out: Item[] = [];
  const ranked = [...r.shuffle(pool.filter(sameFamily)), ...r.shuffle(pool.filter((o) => !sameFamily(o) && isKana(o) === isKana(item)))];
  for (const o of ranked) {
    if (out.length >= n) break;
    if (o.id === item.id) continue;
    const k1 = key(o, side);
    const k2 = key(o, side === 'jp' ? 'en' : 'jp');
    if (seen.has(k1) || seen.has(k2)) continue;
    seen.add(k1);
    seen.add(k2);
    out.push(o);
  }
  return out;
}

const withAnswer = (item: Item, others: Item[], r: Rng) => r.shuffle([item, ...others]);

function enWords(s: string): string[] {
  return s.replace(/\(.*?\)/g, '').replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
}

/** Exercise kinds that suit an item, from easiest to hardest. */
export function kindsFor(item: Item): ExerciseKind[] {
  if (isKana(item)) return ['recognize', 'choice', 'listen-choice', 'type'];
  if (item.type === 'sentence') return ['wordbank', 'wordbank', 'listen-type', 'listen-choice'];
  const kinds: ExerciseKind[] = ['choice', 'choice', 'listen-choice', 'type', 'listen-type'];
  if (item.type === 'kanji') kinds.splice(1, 0, 'recognize');
  if (hasTokens(item)) kinds.push('wordbank');
  return kinds;
}

let counter = 0;
const nextId = () => `ex${++counter}`;

/** Build one exercise of `kind` for `item`. `variant` alternates directions. */
export function makeExercise(kind: ExerciseKind, item: Item, pool: Item[], r: Rng, variant = 0): Exercise {
  switch (kind) {
    case 'intro':
      return { id: nextId(), kind, item };
    case 'recognize':
      return { id: nextId(), kind, item, options: withAnswer(item, distractors(item, pool, 3, 'en', r), r) };
    case 'choice': {
      const dir = variant % 2 === 0 ? 'jp2en' : 'en2jp';
      const side = dir === 'jp2en' ? 'en' : 'jp';
      return { id: nextId(), kind, item, dir, options: withAnswer(item, distractors(item, pool, 3, side, r), r) };
    }
    case 'listen-choice':
      return { id: nextId(), kind, item, options: withAnswer(item, distractors(item, pool, 3, 'jp', r), r) };
    case 'listen-type':
      return { id: nextId(), kind, item };
    case 'type':
      return { id: nextId(), kind, item, dir: isKana(item) || variant % 2 === 1 ? 'jp2en' : 'en2jp' };
    case 'wordbank': {
      const dir = variant % 2 === 0 ? 'jp2en' : 'en2jp';
      if (dir === 'en2jp') {
        const answer = item.tokens ?? [item.jp];
        const have = new Set(answer.map((t) => parseToken(t).text));
        const extra = r
          .shuffle(pool.flatMap((o) => o.tokens ?? []))
          .filter((t) => !have.has(parseToken(t).text) && have.add(parseToken(t).text))
          .slice(0, Math.min(4, Math.max(2, 6 - answer.length)));
        return { id: nextId(), kind, item, dir, answer, tiles: r.shuffle([...answer, ...extra]) };
      }
      const answer = enWords(enPrimary(item));
      const have = new Set(answer.map((w) => w.toLowerCase()));
      const extra = r
        .shuffle(pool.filter((o) => !isKana(o)).flatMap((o) => enWords(enPrimary(o))))
        .filter((w) => !have.has(w.toLowerCase()) && have.add(w.toLowerCase()))
        .slice(0, Math.min(4, Math.max(2, 7 - answer.length)));
      return { id: nextId(), kind, item, dir, answer, tiles: r.shuffle([...answer, ...extra]) };
    }
    case 'match':
      throw new Error('use makeMatch');
  }
}

export function makeMatch(items: Item[], r: Rng): Exercise | null {
  const seenJp = new Set<string>();
  const seenEn = new Set<string>();
  const picked: Item[] = [];
  for (const it of r.shuffle(items.filter((i) => i.type !== 'sentence'))) {
    const jp = it.jp;
    const en = key(it, 'en');
    if (seenJp.has(jp) || seenEn.has(en)) continue;
    seenJp.add(jp);
    seenEn.add(en);
    picked.push(it);
    if (picked.length === MATCH_PAIRS) break;
  }
  return picked.length === MATCH_PAIRS ? { id: nextId(), kind: 'match', items: picked } : null;
}

/** Shuffle while avoiding the same item twice in a row where possible. */
function spread(list: Exercise[], r: Rng): Exercise[] {
  const out: Exercise[] = [];
  const rest = r.shuffle(list);
  while (rest.length) {
    const prev = out[out.length - 1];
    const prevId = prev && prev.kind !== 'match' ? prev.item.id : null;
    const i = rest.findIndex((e) => e.kind === 'match' || e.item.id !== prevId);
    out.push(...rest.splice(i === -1 ? 0 : i, 1));
  }
  return out;
}

export function targetCount(newItems: number): number {
  return Math.min(MAX_EXERCISES, Math.max(MIN_EXERCISES, newItems * 2 + 1));
}

/**
 * Turn a lesson's items into 10–15 graded exercises (+ ungraded intro cards).
 * New items are introduced, then checked with an easy recognition exercise,
 * then mixed into harder production exercises. A match-pairs round is added when
 * at least five distinct items are available.
 */
export function generateLesson(items: Item[], opts: GenerateOptions = {}): Exercise[] {
  const r = rng(opts.seed ?? Date.now());
  const pool = dedupe([...items, ...(opts.pool ?? [])]);
  const target = targetCount(opts.introduce === false ? MAX_EXERCISES : items.length);
  const focus = opts.introduce === false ? r.shuffle(items) : items;

  const opening: Exercise[] = [];
  const graded: Exercise[] = [];
  if (opts.introduce !== false) {
    focus.forEach((it, i) => {
      opening.push(makeExercise('intro', it, pool, r));
      opening.push(makeExercise(kindsFor(it)[0], it, pool, r, i));
    });
  }
  const match = makeMatch(items.length >= MATCH_PAIRS ? items : pool, r);
  let gradedCount = opening.length / 2 + (match ? 1 : 0);

  // Round-robin over items, stepping each item through its harder kinds.
  const step = new Map<string, number>();
  for (let i = 0; gradedCount < target && focus.length; i++) {
    const it = focus[i % focus.length];
    const kinds = kindsFor(it);
    const s = (step.get(it.id) ?? (opts.introduce === false ? r.int(kinds.length) : 1)) % kinds.length;
    step.set(it.id, s + 1);
    graded.push(makeExercise(kinds[s], it, pool, r, i + s));
    gradedCount++;
  }
  const tail = spread(graded, r);
  if (match) tail.splice(Math.min(tail.length, Math.floor(tail.length / 2)), 0, match);
  return [...opening, ...tail];
}

function dedupe(items: Item[]): Item[] {
  const m = new Map<string, Item>();
  for (const it of items) if (!m.has(it.id)) m.set(it.id, it);
  return [...m.values()];
}
