import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
// @ts-expect-error plain JS module shared with the CLI
import { validateUnits, MAX_NEW_ITEMS } from '../scripts/lib/validate.mjs';
import { UNITS, PATH } from '@/data/course';
import { checkAnswer, checkMeaning, enList } from '@/lesson/checkAnswer';

describe('course content', () => {
  it('passes schema validation', () => {
    const { errors } = validateUnits(UNITS, { kanjivgDir: join(__dirname, '..', 'public', 'kanjivg') });
    expect(errors).toEqual([]);
  });

  it(`introduces at most ${MAX_NEW_ITEMS} items per lesson`, () => {
    for (const n of PATH.filter((p) => !p.checkpoint)) expect(n.lesson.items.length).toBeLessThanOrEqual(MAX_NEW_ITEMS);
  });

  it('starts with hiragana, then katakana', () => {
    expect(UNITS[0].title).toMatch(/Hiragana/);
    const kata = UNITS.findIndex((u) => /Katakana/.test(u.title));
    expect(kata).toBeGreaterThan(0);
    expect(UNITS.slice(0, kata).every((u) => /Hiragana/.test(u.title))).toBe(true);
  });

  it('every item accepts its own written form, reading, romaji and meanings', () => {
    for (const u of UNITS)
      for (const l of u.lessons)
        for (const it of l.items) {
          for (const a of [it.jp, it.kana, it.romaji]) expect(checkAnswer(it, a, 'jp'), `${it.id}: ${a}`).toBe(true);
          for (const e of enList(it)) expect(checkMeaning(it, it.type === 'kana' ? it.romaji : e), `${it.id}: ${e}`).toBe(true);
        }
  });

  it('covers all 46 basic hiragana and katakana', () => {
    const kana = UNITS.flatMap((u) => u.lessons.flatMap((l) => l.items)).filter((i) => i.type === 'kana');
    expect(kana.filter((i) => i.id.startsWith('h.')).length).toBeGreaterThanOrEqual(46);
    expect(kana.filter((i) => i.id.startsWith('k.')).length).toBeGreaterThanOrEqual(46);
  });
});
