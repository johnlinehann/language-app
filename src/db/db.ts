import Dexie, { type Table } from 'dexie';
import type { Card } from '@/types';

export interface LessonRecord {
  lessonId: string;
  firstCompletedAt: number;
  lastCompletedAt: number;
  bestAccuracy: number;
  timesCompleted: number;
}

export interface XpEvent {
  id?: number;
  date: string; // YYYY-MM-DD local
  at: number;
  xp: number;
  source: string;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

export class KotobaDB extends Dexie {
  cards!: Table<Card, string>;
  lessons!: Table<LessonRecord, string>;
  xp!: Table<XpEvent, number>;
  meta!: Table<MetaRow, string>;

  constructor(name = 'kotoba') {
    super(name);
    this.version(1).stores({
      cards: 'itemId, due, state',
      lessons: 'lessonId',
      xp: '++id, date',
      meta: 'key',
    });
  }
}

export const db = new KotobaDB();

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  await db.meta.put({ key, value });
}
