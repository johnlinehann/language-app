import { useEffect } from 'react';
import { ItemJp } from '@/components/Furigana';
import { enPrimary } from '@/lesson/checkAnswer';
import type { Item } from '@/types';

/** Answer display for a Japanese answer: written form, reading and romaji. */
export function JpSolution({ item }: { item: Item }) {
  return (
    <span>
      <ItemJp item={item} className="font-bold" />
      {item.kana !== item.jp && <span lang="ja"> ({item.kana})</span>}
      {item.type !== 'kana' && <span className="opacity-70"> · {item.romaji}</span>}
      {item.type !== 'kana' && <span className="block text-sm opacity-80">“{enPrimary(item)}”</span>}
    </span>
  );
}

export function EnSolution({ item }: { item: Item }) {
  return <span>{item.type === 'kana' ? item.romaji : enPrimary(item)}</span>;
}

/** What a kana or word "means" from the learner's side: romaji sound for kana, English otherwise. */
export const meaningOf = (item: Item) => (item.type === 'kana' ? item.romaji : enPrimary(item));

export function Prompt({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-xl font-extrabold sm:text-2xl">{children}</h2>;
}

/** Number keys 1–9 pick options. */
export function useNumberKeys(count: number, onPick: (i: number) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= count) {
        e.preventDefault();
        onPick(n - 1);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [count, onPick, enabled]);
}
