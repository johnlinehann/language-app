// KanjiVG (CC BY-SA 3.0, Ulrich Apel) — stroke-order SVGs, one file per character.
import { join } from 'node:path';
import { download } from './download.mjs';

const BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/';

export const kanjivgFile = (ch) => ch.codePointAt(0).toString(16).padStart(5, '0') + '.svg';

/** Extract stroke path data, in stroke order, from a KanjiVG SVG string. */
export function strokePaths(svg) {
  return [...svg.matchAll(/<path[^>]*\sid="kvg:[0-9a-f]+-s\d+"[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
}

/** Download SVGs for each character into outDir. Returns the characters that failed. */
export async function fetchKanjiVG(chars, outDir) {
  const missing = [];
  for (const ch of new Set(chars)) {
    try {
      await download(BASE + kanjivgFile(ch), join(outDir, kanjivgFile(ch)));
    } catch {
      missing.push(ch);
    }
  }
  return missing;
}
