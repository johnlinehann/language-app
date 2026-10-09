import { useEffect } from 'react';
import type { IntroEx } from '@/lesson/exercises';
import type { ExProps } from './types';
import { ItemJp } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { StrokeOrder } from '@/components/StrokeOrder';
import { enList } from '@/lesson/checkAnswer';

export default function Intro({ ex, finish }: ExProps<IntroEx>) {
  const { item } = ex;
  const kana = item.type === 'kana';
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Enter' && finish({ correct: true, silent: true });
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [finish]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="rounded-full bg-shu-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-shu-600 dark:bg-shu-700/30 dark:text-shu-400">
        {kana ? 'New character' : item.type === 'sentence' ? 'New sentence' : 'New word'}
      </span>
      {item.emoji && <span className="text-6xl" aria-hidden>{item.emoji}</span>}
      <ItemJp item={item} className={`font-bold ${item.jp.length <= 2 ? 'text-7xl' : item.jp.length <= 6 ? 'text-5xl' : 'text-3xl'}`} />
      <p className="text-lg">
        {!kana && item.kana !== item.jp && <span lang="ja" className="mr-2">{item.kana}</span>}
        <span className="font-bold text-ai-500 dark:text-ai-400">{item.romaji}</span>
      </p>
      {!kana && <p className="text-xl font-bold">{enList(item).slice(0, 2).join(' · ')}</p>}
      <SpeakButton text={item.audioText} autoPlay slow />
      {item.strokes && item.strokes.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {item.strokes.slice(0, 3).map((c) => (
            <StrokeOrder key={c} char={c} size={item.strokes!.length > 1 ? 110 : 150} />
          ))}
        </div>
      )}
      {item.note && <p className="card max-w-sm p-3 text-sm">💡 {item.note}</p>}
      <button type="button" className="btn-primary mt-2 w-full" onClick={() => finish({ correct: true, silent: true })} autoFocus>
        Got it <span className="kbd">Enter</span>
      </button>
    </div>
  );
}
