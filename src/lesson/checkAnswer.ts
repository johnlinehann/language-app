import { toHiragana, toRomaji } from 'wanakana';
import type { Item } from '@/types';

const PUNCT = /[\s.,!?;:'"’‘“”`~()（）[\]{}、。！？・「」『』…\-‐–—_/]+/g;
const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "it's": 'it is', "that's": 'that is', "what's": 'what is',
  "isn't": 'is not', "don't": 'do not', "let's": 'let us', "he's": 'he is', "she's": 'she is',
  "we're": 'we are', "they're": 'they are', "aren't": 'are not',
};
const ARTICLES = /\b(a|an|the)\b/g;

export const enList = (item: Pick<Item, 'en'>) => (Array.isArray(item.en) ? item.en : [item.en]);
export const enPrimary = (item: Pick<Item, 'en'>) => enList(item)[0];

/** Normalize English: case, punctuation, contractions, articles, parenthetical notes. */
export function normalizeEn(s: string): string {
  let t = s.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\(.*?\)/g, ' ');
  t = t.replace(/[a-z]+'[a-z]+/g, (w) => CONTRACTIONS[w] ?? w);
  t = t.replace(ARTICLES, ' ');
  return t.replace(PUNCT, '');
}

/**
 * Normalize Japanese or romaji to a lenient romaji key: katakana and hiragana
 * become equal, long vowels collapse (ou/oo/uu/ー), punctuation and spaces vanish.
 * Kanji pass through unchanged.
 */
export function normalizeJa(s: string): string {
  let t = s.normalize('NFKC').toLowerCase().replace(PUNCT, '');
  t = t.replace(/[āâ]/g, 'aa').replace(/[īî]/g, 'ii').replace(/[ūû]/g, 'uu').replace(/[ēê]/g, 'ee').replace(/[ōô]/g, 'ou');
  // Romaji → kana first so "konnichi wa" and "こんにちわ" meet in the same space.
  t = toRomaji(toHiragana(t, { passRomaji: false }));
  t = t.replace(/'/g, '').replace(/-/g, '');
  return t.replace(/([aeiou])\1+/g, '$1').replace(/ou/g, 'o').replace(/ei/g, 'e').replace(/nn/g, 'n');
}

export type Target = 'jp' | 'en';

/** All normalized strings accepted for `item` when the learner answers in `target`. */
export function acceptedKeys(item: Item, target: Target): Set<string> {
  const keys =
    target === 'en'
      ? enList(item).map(normalizeEn)
      : [item.jp, item.kana, item.romaji, ...(item.alt ?? [])].map(normalizeJa);
  return new Set(keys.filter(Boolean));
}

export function checkAnswer(item: Item, answer: string, target: Target): boolean {
  const key = target === 'en' ? normalizeEn(answer) : normalizeJa(answer);
  if (!key) return false;
  return acceptedKeys(item, target).has(key);
}

/** For kana items the "meaning" is the romaji sound, so answers are compared as Japanese. */
export function checkMeaning(item: Item, answer: string): boolean {
  return item.type === 'kana' ? checkAnswer(item, answer, 'jp') : checkAnswer(item, answer, 'en');
}
