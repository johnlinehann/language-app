import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// Plain JS pipeline modules shared with scripts/build-content.mjs
// @ts-expect-error untyped JS module
import { masu, te, classFromPos } from '../scripts/lib/conjugate.mjs';
// @ts-expect-error untyped JS module
import { loadJmdict, lookup } from '../scripts/lib/jmdict.mjs';
// @ts-expect-error untyped JS module
import { loadKanjidic, isBeginnerKanji } from '../scripts/lib/kanjidic.mjs';
// @ts-expect-error untyped JS module
import { loadPairs, loadSentences, segment } from '../scripts/lib/tatoeba.mjs';
// @ts-expect-error untyped JS module
import { strokePaths, kanjivgFile } from '../scripts/lib/kanjivg.mjs';
// @ts-expect-error untyped JS module
import { createBuilder, buildUnits, sentenceRomaji } from '../scripts/build-content.mjs';
// @ts-expect-error untyped JS module
import { TOPICS } from '../scripts/topics.mjs';
// @ts-expect-error untyped JS module
import { validateUnits } from '../scripts/lib/validate.mjs';

const fixture = (f: string) => readFileSync(join(__dirname, 'fixtures', f), 'utf8').split('\n');

describe('conjugation', () => {
  it.each([
    ['食べる', 'たべる', 'ichidan', '食べます', '食べて'],
    ['飲む', 'のむ', 'godan', '飲みます', '飲んで'],
    ['書く', 'かく', 'godan', '書きます', '書いて'],
    ['泳ぐ', 'およぐ', 'godan', '泳ぎます', '泳いで'],
    ['話す', 'はなす', 'godan', '話します', '話して'],
    ['待つ', 'まつ', 'godan', '待ちます', '待って'],
    ['買う', 'かう', 'godan', '買います', '買って'],
    ['帰る', 'かえる', 'godan', '帰ります', '帰って'],
    ['遊ぶ', 'あそぶ', 'godan', '遊びます', '遊んで'],
    ['死ぬ', 'しぬ', 'godan', '死にます', '死んで'],
    ['行く', 'いく', 'iku', '行きます', '行って'],
    ['勉強する', 'べんきょうする', 'suru', '勉強します', '勉強して'],
  ])('%s → %s / %s', (jp, kana, cls, m, t) => {
    expect(masu(jp, kana, cls).jp).toBe(m);
    expect(te(jp, kana, cls).jp).toBe(t);
  });
  it('来る changes its reading but not its kanji', () => {
    expect(masu('来る', 'くる', 'kuru')).toEqual({ jp: '来ます', kana: 'きます' });
    expect(te('来る', 'くる', 'kuru')).toEqual({ jp: '来て', kana: 'きて' });
  });
  it('maps JMdict pos tags to classes', () => {
    expect(classFromPos(['v1', 'vt'])).toBe('ichidan');
    expect(classFromPos(['v5k-s'])).toBe('iku');
    expect(classFromPos(['v5r'])).toBe('godan');
    expect(classFromPos(['vs-i'])).toBe('suru');
    expect(classFromPos(['n'])).toBe(null);
  });
});

describe('source parsers', () => {
  it('parses JMdict entries, pos entities and priorities', async () => {
    const dict = await loadJmdict(fixture('JMdict_sample.xml'));
    expect(dict.size).toBe(4);
    const e = lookup(dict, '食べる', 'たべる');
    expect(e.id).toBe('1358280');
    expect(e.senses[0].pos).toEqual(['v1', 'vt']);
    expect(e.senses[1].pos).toEqual(['v1', 'vt']); // inherited
    expect(e.senses[0].gloss).toEqual(['to eat']);
    expect(e.common).toBe(true);
    expect(lookup(dict, 'ねこ', 'ねこ')?.kanji).toEqual(['猫']);
    expect(lookup(dict, '犬', 'いぬ')).toBe(null);
  });

  it('parses KANJIDIC2 characters', async () => {
    const k = await loadKanjidic(fixture('kanjidic2_sample.xml'));
    expect(k.get('食')).toMatchObject({ jlpt: 4, grade: 2, strokes: 9, meanings: ['eat', 'food'] }); // English only
    expect(isBeginnerKanji(k.get('食'))).toBe(true);
    expect(isBeginnerKanji(k.get('猫'))).toBe(false);
  });

  it('pairs Tatoeba sentences with translations', async () => {
    const jpn = await loadSentences(['1\tjpn\t猫が好きです。', '2\tjpn\tとても長い文はここに入らないことになっています。'], (t: string) => t.length <= 14);
    const eng = await loadSentences(['10\teng\tI like cats.', '11\teng\tLong.']);
    const pairs = await loadPairs(['1\t10', '2\t11', '1\t11'], jpn, eng);
    expect(pairs).toEqual([{ id: '1', jp: '猫が好きです。', en: 'I like cats.' }]);
  });

  it('segments only sentences whose kanji readings are known', () => {
    const lex = new Map([['猫', 'ねこ'], ['好き', 'すき'], ['です', 'です'], ['が', 'が']]);
    expect(segment('猫が好きです。', lex)).toEqual(['猫|ねこ', 'が', '好き|すき', 'です']);
    expect(segment('犬が好きです。', lex)).toBe(null);
    expect(segment('Tom が好きです', lex)).toBe(null);
  });

  it('extracts KanjiVG stroke paths in order', () => {
    const svg = readFileSync(join(__dirname, '..', 'public', 'kanjivg', kanjivgFile('一')), 'utf8');
    expect(strokePaths(svg)).toHaveLength(1);
    const svg2 = readFileSync(join(__dirname, '..', 'public', 'kanjivg', kanjivgFile('あ')), 'utf8');
    expect(strokePaths(svg2)).toHaveLength(3);
  });
});

describe('generator', () => {
  it('builds valid units from seeds offline', () => {
    const b = createBuilder({ jmdict: null, kanjidic: null, pairs: null }, []);
    const units = buildUnits(TOPICS, b);
    expect(validateUnits(units).errors).toEqual([]);
    const te = units.find((u: { unit: string }) => u.unit === 'u10');
    expect(te.lessons[0].items.map((i: { jp: string }) => i.jp)).toContain('飲んで');
  });

  it('enriches with JMdict glosses and sources when available', async () => {
    const dict = await loadJmdict(fixture('JMdict_sample.xml'));
    const b = createBuilder({ jmdict: dict, kanjidic: null, pairs: null }, []);
    const cat = b.build({ kind: 'word', jp: '猫', kana: 'ねこ', en: 'cat' });
    expect(cat.en).toEqual(['cat', 'domestic cat']);
    expect(cat.source).toBe('jmdict:1467640');
  });

  it('reads particles correctly in sentence romaji', () => {
    expect(sentenceRomaji(['私|わたし', 'は', '駅|えき', 'へ', '水|みず', 'を'])).toBe('watashi wa eki e mizu o');
  });
});
