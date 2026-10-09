import { useEffect, useRef } from 'react';
import { bind, unbind } from 'wanakana';
import type { ListenTypeEx, TypeEx } from '@/lesson/exercises';
import type { ExProps } from './types';
import { checkAnswer, checkMeaning } from '@/lesson/checkAnswer';
import { JpWithRomaji } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { EnSolution, JpSolution, Prompt, meaningOf } from './shared';

/** Free-typing answers. Japanese answers convert romaji → kana as you type (wanakana). */
export default function TypeAnswer({ ex, locked, setPending }: ExProps<TypeEx | ListenTypeEx>) {
  const { item } = ex;
  const ref = useRef<HTMLInputElement>(null);
  const kana = item.type === 'kana';
  // jp: learner writes Japanese. en: learner writes English (or romaji for kana sounds).
  const target: 'jp' | 'en' = ex.kind === 'listen-type' || ex.dir === 'en2jp' ? 'jp' : 'en';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (target === 'jp') bind(el, { IMEMode: true });
    el.focus({ preventScroll: true });
    return () => {
      if (target === 'jp') unbind(el);
    };
  }, [target]);

  const onInput = () => {
    const value = ref.current?.value ?? '';
    if (!value.trim()) return setPending(null);
    setPending(() => {
      const answer = ref.current?.value ?? '';
      const correct = target === 'jp' ? checkAnswer(item, answer, 'jp') : kana ? checkMeaning(item, answer) : checkAnswer(item, answer, 'en');
      return { correct, solution: target === 'jp' ? <JpSolution item={item} /> : <EnSolution item={item} /> };
    });
  };

  return (
    <div>
      {ex.kind === 'listen-type' ? (
        <>
          <Prompt>Type what you hear</Prompt>
          <div className="mb-6 flex justify-center">
            <SpeakButton text={item.audioText} autoPlay size="lg" slow />
          </div>
        </>
      ) : ex.dir === 'en2jp' ? (
        <>
          <Prompt>Write this in Japanese</Prompt>
          <p className="card mb-6 flex items-center gap-3 px-4 py-3 text-2xl font-bold">
            {item.emoji && <span aria-hidden>{item.emoji}</span>}
            {meaningOf(item)}
          </p>
        </>
      ) : (
        <>
          <Prompt>{kana ? 'Type the sound in romaji' : 'Type the meaning in English'}</Prompt>
          <div className="mb-6 flex items-center gap-3">
            <SpeakButton text={item.audioText} autoPlay />
            <span className="card px-4 py-3 text-3xl font-bold">
              <JpWithRomaji item={item} />
            </span>
          </div>
        </>
      )}
      <label className="block">
        <span className="sr-only">{target === 'jp' ? 'Your answer in Japanese (romaji converts to kana)' : 'Your answer'}</span>
        <input
          ref={ref}
          type="text"
          lang={target === 'jp' ? 'ja' : 'en'}
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={locked}
          onInput={onInput}
          placeholder={target === 'jp' ? 'Type in romaji or kana…' : kana ? 'Type in romaji…' : 'Type in English…'}
          className="w-full rounded-2xl border-2 border-washi-200 bg-white px-4 py-4 text-2xl outline-none focus:border-ai-400 dark:border-sumi-700 dark:bg-sumi-800"
        />
      </label>
      {target === 'jp' && <p className="mt-2 text-sm opacity-60">Romaji turns into kana automatically. Use “-” for ー.</p>}
    </div>
  );
}
