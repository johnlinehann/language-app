import { describe, expect, it } from 'vitest';
import { checkAnswer, checkMeaning, normalizeEn, normalizeJa } from '@/lesson/checkAnswer';
import type { Item } from '@/types';

const item = (p: Partial<Item>): Item => ({
  id: 't', jp: '', kana: '', romaji: '', en: '', audioText: '', type: 'word', ...p,
});

const konnichiwa = item({ jp: 'こんにちは', kana: 'こんにちは', romaji: 'konnichiwa', en: ['hello', 'good afternoon'] });
const gakusei = item({ jp: '学生', kana: 'がくせい', romaji: 'gakusei', en: 'student' });
const ramen = item({ jp: 'ラーメンを食べます', kana: 'ラーメンをたべます', romaji: 'raamen o tabemasu', en: ['I eat ramen'] });
const tokyo = item({ jp: '東京', kana: 'とうきょう', romaji: 'toukyou', en: 'Tokyo' });
const yon = item({ jp: '四', kana: 'よん', romaji: 'yon', en: ['four', '4'], alt: ['し', 'shi'] });
const shi = item({ jp: 'し', kana: 'し', romaji: 'shi', en: 'shi', type: 'kana', alt: ['si'] });

describe('checkAnswer — Japanese', () => {
  it('accepts kana, kanji and romaji', () => {
    expect(checkAnswer(gakusei, '学生', 'jp')).toBe(true);
    expect(checkAnswer(gakusei, 'がくせい', 'jp')).toBe(true);
    expect(checkAnswer(gakusei, 'gakusei', 'jp')).toBe(true);
    expect(checkAnswer(gakusei, 'ガクセイ', 'jp')).toBe(true);
  });

  it('accepts the particle は written as は or わ, and romaji with spaces', () => {
    expect(checkAnswer(konnichiwa, 'こんにちは', 'jp')).toBe(true);
    expect(checkAnswer(konnichiwa, 'こんにちわ', 'jp')).toBe(true);
    expect(checkAnswer(konnichiwa, 'konnichi wa', 'jp')).toBe(true);
    expect(checkAnswer(konnichiwa, 'Konnichiwa!', 'jp')).toBe(true);
  });

  it('ignores punctuation, spaces and full-width characters', () => {
    expect(checkAnswer(ramen, 'ラーメンを食べます。', 'jp')).toBe(true);
    expect(checkAnswer(ramen, 'ラーメン を たべます', 'jp')).toBe(true);
    expect(checkAnswer(ramen, 'らーめんをたべます', 'jp')).toBe(true);
    expect(checkAnswer(ramen, 'ｒａｍｅｎ ｏ ｔａｂｅｍａｓｕ', 'jp')).toBe(true);
  });

  it('is lenient with long vowels', () => {
    expect(checkAnswer(tokyo, 'tokyo', 'jp')).toBe(true);
    expect(checkAnswer(tokyo, 'tōkyō', 'jp')).toBe(true);
    expect(checkAnswer(tokyo, 'toukyou', 'jp')).toBe(true);
  });

  it('accepts alternate readings', () => {
    expect(checkAnswer(yon, 'し', 'jp')).toBe(true);
    expect(checkAnswer(yon, 'shi', 'jp')).toBe(true);
    expect(checkMeaning(shi, 'si')).toBe(true);
    expect(checkMeaning(shi, 'SHI')).toBe(true);
  });

  it('rejects wrong answers and empty input', () => {
    expect(checkAnswer(gakusei, 'せんせい', 'jp')).toBe(false);
    expect(checkAnswer(gakusei, '', 'jp')).toBe(false);
    expect(checkAnswer(gakusei, '。', 'jp')).toBe(false);
    expect(checkAnswer(konnichiwa, 'こんばんは', 'jp')).toBe(false);
    expect(checkMeaning(shi, 'chi')).toBe(false);
  });
});

describe('checkAnswer — English', () => {
  it('accepts any listed meaning, ignoring case and punctuation', () => {
    expect(checkAnswer(konnichiwa, 'Hello!', 'en')).toBe(true);
    expect(checkAnswer(konnichiwa, 'good afternoon.', 'en')).toBe(true);
    expect(checkAnswer(yon, '4', 'en')).toBe(true);
  });

  it('ignores articles, contractions and parenthetical notes', () => {
    expect(checkAnswer(gakusei, 'a student', 'en')).toBe(true);
    expect(checkAnswer(item({ en: 'I am a student' }), "I'm a student", 'en')).toBe(true);
    expect(checkAnswer(item({ en: 'good morning (polite)' }), 'Good morning', 'en')).toBe(true);
  });

  it('rejects wrong meanings', () => {
    expect(checkAnswer(gakusei, 'teacher', 'en')).toBe(false);
    expect(checkAnswer(konnichiwa, 'goodbye', 'en')).toBe(false);
  });
});

describe('normalizers', () => {
  it('normalizeEn collapses whitespace and punctuation', () => {
    expect(normalizeEn('  Yes, that’s   right! ')).toBe(normalizeEn('yes that is right'));
  });
  it('normalizeJa maps hiragana, katakana and romaji to the same key', () => {
    expect(normalizeJa('すし')).toBe(normalizeJa('スシ'));
    expect(normalizeJa('すし')).toBe(normalizeJa('sushi'));
  });
});
