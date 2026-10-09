import { describe, expect, it } from 'vitest';
import { alignFurigana, parseToken } from '@/lib/furigana';

describe('alignFurigana', () => {
  it('aligns okurigana', () => {
    expect(alignFurigana('食べます', 'たべます')).toEqual([['食', 'た'], ['べます', '']]);
  });
  it('aligns multiple kanji runs', () => {
    expect(alignFurigana('私は学生です', 'わたしはがくせいです')).toEqual([
      ['私', 'わたし'], ['は', ''], ['学生', 'がくせい'], ['です', ''],
    ]);
  });
  it('handles katakana and kana-only text', () => {
    expect(alignFurigana('アメリカ人', 'アメリカじん')).toEqual([['アメリカ', ''], ['人', 'じん']]);
    expect(alignFurigana('すし', 'すし')).toEqual([['すし', '']]);
  });
  it('falls back to whole-word ruby when alignment fails', () => {
    expect(alignFurigana('今日は', 'きょうわ')).toEqual([['今日は', 'きょうわ']]);
  });
  it('parses word-bank tokens', () => {
    expect(parseToken('学生|がくせい')).toEqual({ text: '学生', reading: 'がくせい' });
    expect(parseToken('は')).toEqual({ text: 'は', reading: 'は' });
  });
});
