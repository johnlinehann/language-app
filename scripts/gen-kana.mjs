#!/usr/bin/env node
// Writes the kana units (content/u00*.json, u01*.json). Kana tables are small and
// fixed, so they are authored here as data rather than typed out item by item.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'content');

// [romaji, hiragana, katakana, extra accepted romaji]
const BASIC = [
  ['a', 'あ', 'ア'], ['i', 'い', 'イ'], ['u', 'う', 'ウ'], ['e', 'え', 'エ'], ['o', 'お', 'オ'],
  ['ka', 'か', 'カ'], ['ki', 'き', 'キ'], ['ku', 'く', 'ク'], ['ke', 'け', 'ケ'], ['ko', 'こ', 'コ'],
  ['sa', 'さ', 'サ'], ['shi', 'し', 'シ', ['si']], ['su', 'す', 'ス'], ['se', 'せ', 'セ'], ['so', 'そ', 'ソ'],
  ['ta', 'た', 'タ'], ['chi', 'ち', 'チ', ['ti']], ['tsu', 'つ', 'ツ', ['tu']], ['te', 'て', 'テ'], ['to', 'と', 'ト'],
  ['na', 'な', 'ナ'], ['ni', 'に', 'ニ'], ['nu', 'ぬ', 'ヌ'], ['ne', 'ね', 'ネ'], ['no', 'の', 'ノ'],
  ['ha', 'は', 'ハ'], ['hi', 'ひ', 'ヒ'], ['fu', 'ふ', 'フ', ['hu']], ['he', 'へ', 'ヘ'], ['ho', 'ほ', 'ホ'],
  ['ma', 'ま', 'マ'], ['mi', 'み', 'ミ'], ['mu', 'む', 'ム'], ['me', 'め', 'メ'], ['mo', 'も', 'モ'],
  ['ya', 'や', 'ヤ'], ['yu', 'ゆ', 'ユ'], ['yo', 'よ', 'ヨ'],
  ['ra', 'ら', 'ラ'], ['ri', 'り', 'リ'], ['ru', 'る', 'ル'], ['re', 'れ', 'レ'], ['ro', 'ろ', 'ロ'],
  ['wa', 'わ', 'ワ'], ['wo', 'を', 'ヲ', ['o']], ['n', 'ん', 'ン', ['nn']],
];
const VOICED = [
  ['ga', 'が', 'ガ'], ['gi', 'ぎ', 'ギ'], ['gu', 'ぐ', 'グ'], ['za', 'ざ', 'ザ'], ['ji', 'じ', 'ジ', ['zi']],
  ['da', 'だ', 'ダ'], ['ba', 'ば', 'バ'], ['pa', 'ぱ', 'パ'],
];

// 46 basic kana → I: 4×7 = 28, II: 5,5,4,4 = 18, then a voiced-sound lesson.
const SPLIT_I = [7, 7, 7, 7];
const SPLIT_II = [5, 5, 4, 4];

const hex = (ch) => ch.codePointAt(0).toString(16).padStart(5, '0');

function item(script, [romaji, hira, kata, alt]) {
  const ch = script === 'h' ? hira : kata;
  return {
    id: `${script}.${romaji}`,
    jp: ch,
    kana: ch,
    romaji,
    en: romaji,
    audioText: ch,
    type: 'kana',
    ...(alt ? { alt } : {}),
    strokes: [ch],
  };
}

function chunk(list, sizes) {
  const out = [];
  let i = 0;
  for (const n of sizes) {
    out.push(list.slice(i, i + n));
    i += n;
  }
  return out;
}

function title(items) {
  return items.map((it) => it.jp).join(' ');
}

function units(script, name, code) {
  const all = BASIC.map((k) => item(script, k));
  const [first, second] = [all.slice(0, 28), all.slice(28)];
  const u1 = {
    unit: `${code}a`,
    title: `${name} I`,
    level: 'Kana',
    description: `The first 28 ${name.toLowerCase()} characters: vowels through the H-row.`,
    checkpoint: true,
    lessons: chunk(first, SPLIT_I).map((items, i) => ({ lesson: `${code}a-l${i + 1}`, title: title(items), items })),
  };
  const voiced = VOICED.slice(0, 7).map((k) => item(script, k));
  const u2 = {
    unit: `${code}b`,
    title: `${name} II`,
    level: 'Kana',
    description: `The rest of ${name.toLowerCase()}, plus the voicing marks ゛ and ゜.`,
    checkpoint: true,
    lessons: [
      ...chunk(second, SPLIT_II).map((items, i) => ({ lesson: `${code}b-l${i + 1}`, title: title(items), items })),
      {
        lesson: `${code}b-l5`,
        title: script === 'h' ? 'Voiced ゛゜' : 'Voiced ゛゜ (カタカナ)',
        items: voiced.map((it) => ({
          ...it,
          note: it.romaji === 'pa' ? 'The circle ゜ turns h- into p-.' : 'The two dots ゛ voice the consonant: k→g, s→z, t→d, h→b.',
        })),
      },
    ],
  };
  return [u1, u2];
}

const files = {
  'u00-hiragana.json': units('h', 'Hiragana', 'u00'),
  'u01-katakana.json': units('k', 'Katakana', 'u01'),
};
for (const [file, data] of Object.entries(files)) {
  writeFileSync(join(OUT, file), JSON.stringify(data, null, 2) + '\n');
  console.log('wrote', file);
}
export { hex };
