import { useState } from 'react';
import type { WordBankEx } from '@/lesson/exercises';
import type { ExProps } from './types';
import { checkAnswer } from '@/lesson/checkAnswer';
import { parseToken } from '@/lib/furigana';
import { JpWithRomaji, TokenJp } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { speak } from '@/audio/tts';
import { sfx } from '@/audio/sfx';
import { EnSolution, JpSolution, Prompt, meaningOf } from './shared';

/** Build the translation from tiles. Tap a bank tile to add it, tap a placed tile to remove it. */
export default function WordBank({ ex, locked, setPending }: ExProps<WordBankEx>) {
  const { item, tiles, dir } = ex;
  const [placed, setPlaced] = useState<number[]>([]);
  const jp = dir === 'en2jp';

  const update = (next: number[]) => {
    setPlaced(next);
    if (!next.length) return setPending(null);
    const text = next.map((i) => (jp ? parseToken(tiles[i]).text : tiles[i])).join(jp ? '' : ' ');
    setPending(() => ({
      correct: checkAnswer(item, text, jp ? 'jp' : 'en'),
      solution: jp ? <JpSolution item={item} /> : <EnSolution item={item} />,
    }));
  };

  const add = (i: number) => {
    if (locked || placed.includes(i)) return;
    sfx.tap();
    if (jp) speak(parseToken(tiles[i]).reading);
    update([...placed, i]);
  };
  const remove = (i: number) => !locked && update(placed.filter((p) => p !== i));

  const Tile = ({ i }: { i: number }) => (jp ? <TokenJp token={tiles[i]} /> : <span>{tiles[i]}</span>);

  return (
    <div>
      <Prompt>{jp ? 'Translate into Japanese' : 'Translate this sentence'}</Prompt>
      <div className="mb-4 flex items-center gap-3">
        {jp ? (
          <p className="card px-4 py-3 text-xl font-bold">{meaningOf(item)}</p>
        ) : (
          <>
            <SpeakButton text={item.audioText} autoPlay />
            <span className="card px-4 py-3 text-2xl font-bold">
              <JpWithRomaji item={item} />
            </span>
          </>
        )}
      </div>
      <div
        aria-label="Your answer"
        aria-live="polite"
        className="mb-6 flex min-h-[112px] flex-wrap content-start gap-2 border-y-2 border-washi-200 py-3 dark:border-sumi-700"
      >
        {placed.map((i) => (
          <button key={i} type="button" className="tile animate-pop" onClick={() => remove(i)} disabled={locked} aria-label={`Remove ${parseToken(tiles[i]).text}`}>
            <Tile i={i} />
          </button>
        ))}
      </div>
      <div aria-label="Word bank" className="flex flex-wrap justify-center gap-2">
        {tiles.map((t, i) =>
          placed.includes(i) ? (
            <span key={i} className="tile border-dashed bg-washi-100 text-transparent shadow-none dark:bg-sumi-900" aria-hidden>
              {parseToken(t).text}
            </span>
          ) : (
            <button key={i} type="button" className="tile" data-tile={i} onClick={() => add(i)} disabled={locked}>
              <Tile i={i} />
            </button>
          ),
        )}
      </div>
    </div>
  );
}
