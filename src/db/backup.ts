import { db, type LessonRecord, type MetaRow, type XpEvent } from './db';
import type { Card } from '@/types';

export interface Backup {
  app: 'kotoba';
  version: 1;
  exportedAt: string;
  cards: Card[];
  lessons: LessonRecord[];
  xp: XpEvent[];
  meta: MetaRow[];
}

export async function exportProgress(): Promise<Backup> {
  const [cards, lessons, xp, meta] = await Promise.all([db.cards.toArray(), db.lessons.toArray(), db.xp.toArray(), db.meta.toArray()]);
  return { app: 'kotoba', version: 1, exportedAt: new Date().toISOString(), cards, lessons, xp, meta };
}

export function isBackup(x: unknown): x is Backup {
  const b = x as Backup;
  return !!b && b.app === 'kotoba' && b.version === 1 && [b.cards, b.lessons, b.xp, b.meta].every(Array.isArray);
}

/** Replace all local progress with a backup. Throws on an invalid file. */
export async function importProgress(data: unknown): Promise<void> {
  if (!isBackup(data)) throw new Error('This file is not a Kotoba backup.');
  await db.transaction('rw', db.cards, db.lessons, db.xp, db.meta, async () => {
    await Promise.all([db.cards.clear(), db.lessons.clear(), db.xp.clear(), db.meta.clear()]);
    await db.cards.bulkPut(data.cards);
    await db.lessons.bulkPut(data.lessons);
    await db.xp.bulkPut(data.xp);
    await db.meta.bulkPut(data.meta);
  });
}

export async function resetProgress(keepSettings = true): Promise<void> {
  const settings = keepSettings ? await db.meta.get('settings') : undefined;
  await db.transaction('rw', db.cards, db.lessons, db.xp, db.meta, async () => {
    await Promise.all([db.cards.clear(), db.lessons.clear(), db.xp.clear(), db.meta.clear()]);
    if (settings) await db.meta.put(settings);
  });
}

export function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
