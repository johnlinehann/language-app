import type { Item } from '@/types';

export type Segment = [text: string, ruby: string];

const KANJI = /[㐀-䶿一-鿿豈-﫿々〆ヶ]/;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const hasKanji = (s: string) => KANJI.test(s);

/**
 * Align a written form with its kana reading, e.g.
 * ("食べます", "たべます") → [["食","た"],["べます",""]].
 * Kana runs in the written form are used as anchors; kanji runs get the reading in between.
 * Falls back to a single ruby over the whole word when alignment is ambiguous.
 */
export function alignFurigana(jp: string, kana: string): Segment[] {
  if (!hasKanji(jp)) return [[jp, '']];
  const runs: { text: string; kanji: boolean }[] = [];
  for (const ch of jp) {
    const k = KANJI.test(ch);
    const last = runs[runs.length - 1];
    if (last && last.kanji === k) last.text += ch;
    else runs.push({ text: ch, kanji: k });
  }
  const re = new RegExp('^' + runs.map((r) => (r.kanji ? '(.+?)' : `(${escapeRe(r.text)})`)).join('') + '$', 'u');
  const m = kana.match(re);
  if (!m) return [[jp, kana]];
  return runs.map((r, i) => [r.text, r.kanji ? m[i + 1] : '']);
}

export function itemFurigana(item: Pick<Item, 'jp' | 'kana' | 'furigana'>): Segment[] {
  return item.furigana ?? alignFurigana(item.jp, item.kana);
}

/** Parse a word-bank token "学生|がくせい" into its text and reading. */
export function parseToken(token: string): { text: string; reading: string } {
  const [text, reading] = token.split('|');
  return { text, reading: reading ?? text };
}
