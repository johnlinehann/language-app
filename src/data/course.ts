import type { Item, Lesson, Unit } from '@/types';

// Every JSON file under /content (hand-authored and generated) is a Unit or Unit[].
const modules = import.meta.glob<{ default: Unit | Unit[] }>('/content/**/*.json', { eager: true });

export const UNITS: Unit[] = Object.values(modules)
  .flatMap((m) => m.default)
  .sort((a, b) => a.unit.localeCompare(b.unit, 'en', { numeric: true }));

export interface LessonRef {
  unit: Unit;
  lesson: Lesson;
  /** Index in the flat course order (checkpoints included). */
  order: number;
  checkpoint: boolean;
}

export const checkpointId = (unit: Unit) => `${unit.unit}-checkpoint`;

/** Flat, ordered list of every playable node: each unit's lessons, then its checkpoint. */
export const PATH: LessonRef[] = UNITS.flatMap((unit) => {
  const nodes = unit.lessons.map((lesson) => ({ unit, lesson, checkpoint: false }));
  if (unit.checkpoint)
    nodes.push({
      unit,
      checkpoint: true,
      lesson: { lesson: checkpointId(unit), title: `${unit.title} checkpoint`, items: unit.lessons.flatMap((l) => l.items) },
    });
  return nodes;
}).map((n, order) => ({ ...n, order }));

export const ITEMS = new Map<string, Item>(UNITS.flatMap((u) => u.lessons.flatMap((l) => l.items)).map((i) => [i.id, i]));

export const findLesson = (id: string) => PATH.find((n) => n.lesson.lesson === id);

/** Items taught strictly before this node (for distractors and match pairs). */
export function itemsBefore(order: number): Item[] {
  const out: Item[] = [];
  for (const n of PATH) {
    if (n.order >= order) break;
    if (!n.checkpoint) out.push(...n.lesson.items);
  }
  return out;
}

/** A node is unlocked when every node before it has been completed. */
export function isUnlocked(order: number, completed: Set<string>): boolean {
  return PATH.slice(0, order).every((n) => completed.has(n.lesson.lesson));
}
