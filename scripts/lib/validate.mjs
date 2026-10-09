// Content schema checks shared by `npm run content:validate` and the Vitest suite.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const MAX_NEW_ITEMS = 7;
const TYPES = new Set(['kana', 'word', 'phrase', 'kanji', 'sentence']);
const REQUIRED = ['id', 'jp', 'kana', 'romaji', 'en', 'audioText', 'type'];

/**
 * Validate a list of units. Returns { errors, warnings } as arrays of strings.
 * `kanjivgDir` (optional) enables checking that stroke SVGs exist.
 */
export function validateUnits(units, { kanjivgDir } = {}) {
  const errors = [];
  const warnings = [];
  const itemIds = new Map();
  const unitIds = new Set();
  const lessonIds = new Set();

  for (const u of units) {
    const where = `unit ${u.unit ?? '?'}`;
    if (!u.unit || !u.title || !Array.isArray(u.lessons)) errors.push(`${where}: needs unit, title and lessons[]`);
    if (unitIds.has(u.unit)) errors.push(`${where}: duplicate unit id`);
    unitIds.add(u.unit);
    const n = u.lessons?.length ?? 0;
    if (n < 4 || n > 6) warnings.push(`${where}: has ${n} lessons (aim for 4–6)`);

    for (const l of u.lessons ?? []) {
      const lw = `${where} / ${l.lesson}`;
      if (!l.lesson || !l.title) errors.push(`${lw}: needs lesson and title`);
      if (lessonIds.has(l.lesson)) errors.push(`${lw}: duplicate lesson id`);
      lessonIds.add(l.lesson);
      if (!Array.isArray(l.items) || l.items.length === 0) errors.push(`${lw}: no items`);
      if ((l.items?.length ?? 0) > MAX_NEW_ITEMS) errors.push(`${lw}: ${l.items.length} new items (max ${MAX_NEW_ITEMS})`);

      for (const it of l.items ?? []) {
        const iw = `${lw} / ${it.id ?? '?'}`;
        for (const f of REQUIRED) if (it[f] === undefined || it[f] === '' || (Array.isArray(it[f]) && !it[f].length)) errors.push(`${iw}: missing ${f}`);
        if (it.type && !TYPES.has(it.type)) errors.push(`${iw}: unknown type ${it.type}`);
        if (itemIds.has(it.id)) errors.push(`${iw}: duplicate item id (also in ${itemIds.get(it.id)})`);
        itemIds.set(it.id, l.lesson);
        if (it.tokens) {
          const joined = it.tokens.map((t) => t.split('|')[0]).join('');
          const target = it.jp.replace(/[、。！？!?,.\s]/g, '');
          if (joined !== target) errors.push(`${iw}: tokens "${joined}" don't spell jp "${target}"`);
        }
        if (it.furigana) {
          const joined = it.furigana.map(([t]) => t).join('');
          if (joined !== it.jp) errors.push(`${iw}: furigana segments don't spell jp`);
        }
        if (kanjivgDir)
          for (const ch of it.strokes ?? []) {
            const f = ch.codePointAt(0).toString(16).padStart(5, '0') + '.svg';
            if (!existsSync(join(kanjivgDir, f))) warnings.push(`${iw}: no stroke SVG for ${ch} (run npm run content:strokes)`);
          }
      }
    }
  }
  return { errors, warnings };
}
