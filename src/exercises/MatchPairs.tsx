import { useEffect, useMemo, useRef, useState } from 'react';
import type { MatchEx } from '@/lesson/exercises';
import type { ExProps } from './types';
import { ItemJp } from '@/components/Furigana';
import { speak } from '@/audio/tts';
import { sfx } from '@/audio/sfx';
import { rng } from '@/lib/rng';
import { Prompt, meaningOf } from './shared';

type Side = 'jp' | 'en';

/** Tap a Japanese card and its meaning to clear the pair. */
export default function MatchPairs({ ex, finish }: ExProps<MatchEx>) {
  const [left, right] = useMemo(() => {
    const r = rng(ex.id.length * 7919 + ex.items.length);
    return [r.shuffle(ex.items), r.shuffle(ex.items)];
  }, [ex]);
  const [sel, setSel] = useState<{ side: Side; id: string } | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string[]>([]);
  const missed = useRef(new Set<string>());

  useEffect(() => {
    if (done.size === ex.items.length) {
      const t = setTimeout(() => finish({ correct: true, silent: true, missed: [...missed.current] }), 400);
      return () => clearTimeout(t);
    }
  }, [done, ex.items.length, finish]);

  const tap = (side: Side, id: string) => {
    if (done.has(id)) return;
    if (side === 'jp') speak(ex.items.find((i) => i.id === id)!.audioText);
    if (!sel || sel.side === side) {
      sfx.tap();
      return setSel({ side, id });
    }
    if (sel.id === id) {
      sfx.match();
      setDone(new Set([...done, id]));
    } else {
      sfx.wrong();
      missed.current.add(id).add(sel.id);
      setWrong([`${sel.side}:${sel.id}`, `${side}:${id}`]);
      setTimeout(() => setWrong([]), 500);
    }
    setSel(null);
  };

  const card = (side: Side, id: string, label: React.ReactNode, aria: string) => {
    const isDone = done.has(id);
    const isSel = sel?.side === side && sel.id === id;
    const isWrong = wrong.includes(`${side}:${id}`);
    return (
      <button
        key={side + id}
        type="button"
        disabled={isDone}
        aria-pressed={isSel}
        aria-label={aria}
        data-match={`${side}:${id}`}
        onClick={() => tap(side, id)}
        className={`option min-h-[64px] justify-center text-center transition-opacity ${isDone ? 'border-matcha-400 bg-matcha-50 text-matcha-600 opacity-40 shadow-none dark:bg-matcha-600/20' : ''} ${isWrong ? 'animate-shake border-rose-400 bg-rose-50 text-rose-600 dark:bg-rose-900/30' : ''}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div>
      <Prompt>Tap the matching pairs</Prompt>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">
          {left.map((it) => card('jp', it.id, <ItemJp item={it} className="text-xl font-semibold" />, it.jp))}
        </div>
        <div className="flex flex-col gap-3">{right.map((it) => card('en', it.id, <span className="font-semibold">{meaningOf(it)}</span>, meaningOf(it)))}</div>
      </div>
    </div>
  );
}
