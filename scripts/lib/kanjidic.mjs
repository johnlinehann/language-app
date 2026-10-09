// KANJIDIC2 (EDRDG, CC BY-SA 4.0) parser: per-kanji JLPT level, grade, stroke count, meanings.
export const KANJIDIC_URL = 'http://www.edrdg.org/kanjidic/kanjidic2.xml.gz';

const one = (block, tag) => block.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`))?.[1];

export function parseCharacter(block) {
  return {
    literal: one(block, 'literal'),
    // KANJIDIC2 uses the pre-2010 four-level JLPT scale: 4 ≈ N5, 3 ≈ N4, 2 ≈ N3/N2, 1 ≈ N1.
    jlpt: Number(one(block, 'jlpt')) || null,
    grade: Number(one(block, 'grade')) || null,
    strokes: Number(one(block, 'stroke_count')) || null,
    meanings: [...block.matchAll(/<meaning>([^<]*)<\/meaning>/g)].map((m) => m[1]),
  };
}

export async function loadKanjidic(lines) {
  const map = new Map();
  let buf = null;
  for await (const line of lines) {
    if (line.includes('<character>')) buf = [];
    if (buf) buf.push(line);
    if (line.includes('</character>') && buf) {
      const c = parseCharacter(buf.join('\n'));
      if (c.literal) map.set(c.literal, c);
      buf = null;
    }
  }
  return map;
}

/** Old JLPT 4/3 ≈ N5/N4: the kanji a beginner course should teach strokes for. */
export const isBeginnerKanji = (info) => !!info && (info.jlpt === 4 || info.jlpt === 3);
