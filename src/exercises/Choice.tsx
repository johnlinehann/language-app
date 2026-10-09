import { useCallback, useState } from 'react';
import type { ChoiceEx, ListenChoiceEx, RecognizeEx } from '@/lesson/exercises';
import type { ExProps } from './types';
import { ItemJp, JpWithRomaji } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { speak } from '@/audio/tts';
import { sfx } from '@/audio/sfx';
import { useSettings } from '@/state/settings';
import type { Item } from '@/types';
import { EnSolution, JpSolution, Prompt, meaningOf, useNumberKeys } from './shared';

type Props = ExProps<ChoiceEx | RecognizeEx | ListenChoiceEx>;

/** Multiple choice: meaning, picture, recognition and listening variants. */
export default function Choice({ ex, locked, setPending }: Props) {
  const { settings } = useSettings();
  const [picked, setPicked] = useState<number | null>(null);
  const { item, options } = ex;
  const answerSide: 'jp' | 'en' | 'reading' =
    ex.kind === 'recognize' ? (item.type === 'kana' ? 'en' : 'reading') : ex.kind === 'listen-choice' ? 'jp' : ex.dir === 'jp2en' ? 'en' : 'jp';
  const pictures = answerSide === 'jp' && ex.kind === 'choice' && options.every((o) => o.emoji);

  const pick = useCallback(
    (i: number) => {
      if (locked) return;
      setPicked(i);
      sfx.tap();
      if (answerSide === 'jp' && ex.kind !== 'listen-choice') speak(options[i].audioText);
      const chosen = options[i];
      setPending(() => ({
        correct: chosen.id === item.id,
        solution: answerSide === 'en' ? <EnSolution item={item} /> : <JpSolution item={item} />,
      }));
    },
    [locked, options, item, answerSide, ex.kind, setPending],
  );
  useNumberKeys(options.length, pick, !locked);

  return (
    <div>
      {ex.kind === 'recognize' && (
        <>
          <Prompt>{item.type === 'kana' ? 'What sound does this make?' : 'How do you read this?'}</Prompt>
          <div className="mb-6 flex items-center justify-center gap-4">
            <span lang="ja" className="text-8xl font-bold">{item.jp}</span>
          </div>
        </>
      )}
      {ex.kind === 'listen-choice' && (
        <>
          <Prompt>What do you hear?</Prompt>
          <div className="mb-6 flex justify-center">
            <SpeakButton text={item.audioText} autoPlay size="lg" slow />
          </div>
        </>
      )}
      {ex.kind === 'choice' && ex.dir === 'jp2en' && (
        <>
          <Prompt>{item.type === 'kana' ? 'Which sound is this?' : 'What does this mean?'}</Prompt>
          <div className="mb-6 flex items-center gap-3">
            <SpeakButton text={item.audioText} autoPlay />
            <span className="card relative px-4 py-3 text-3xl font-bold">
              <JpWithRomaji item={item} />
            </span>
          </div>
        </>
      )}
      {ex.kind === 'choice' && ex.dir === 'en2jp' && (
        <Prompt>
          {item.type === 'kana' ? 'Which character is ' : 'Which one is '}
          <span className="text-shu-500">“{meaningOf(item)}”</span>?
        </Prompt>
      )}

      <div role="radiogroup" aria-label="Answer options" className={pictures ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
        {options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={picked === i}
            disabled={locked}
            onClick={() => pick(i)}
            className={`option ${pictures ? 'aspect-square flex-col justify-center text-center' : ''}`}
          >
            {!pictures && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-current text-xs font-bold opacity-40">{i + 1}</span>}
            {pictures && <span className="text-5xl" aria-hidden>{o.emoji}</span>}
            <OptionLabel item={o} side={answerSide} romaji={settings.romaji} />
          </button>
        ))}
      </div>
    </div>
  );
}

function OptionLabel({ item, side, romaji }: { item: Item; side: 'jp' | 'en' | 'reading'; romaji: boolean }) {
  if (side === 'en') return <span className="font-semibold">{meaningOf(item)}</span>;
  if (side === 'reading')
    return (
      <span className="flex flex-col">
        <span lang="ja" className="text-xl font-semibold">{item.kana}</span>
        {romaji && <span className="text-sm opacity-60">{item.romaji}</span>}
      </span>
    );
  return (
    <span className="flex flex-col">
      <ItemJp item={item} className="text-xl font-semibold" />
      {romaji && item.type !== 'kana' && <span className="text-sm opacity-60">{item.romaji}</span>}
    </span>
  );
}
