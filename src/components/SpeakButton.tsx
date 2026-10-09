import { useEffect } from 'react';
import { speak } from '@/audio/tts';
import { IconSpeaker, IconTurtle } from './Icons';

export function SpeakButton({ text, autoPlay = false, size = 'md', slow = false, label }: { text: string; autoPlay?: boolean; size?: 'md' | 'lg'; slow?: boolean; label?: string }) {
  useEffect(() => {
    if (!autoPlay) return;
    const t = setTimeout(() => speak(text), 250);
    return () => clearTimeout(t);
  }, [text, autoPlay]);
  const big = size === 'lg';
  return (
    <span className="inline-flex items-end gap-2">
      <button
        type="button"
        onClick={() => speak(text)}
        aria-label={label ?? 'Play audio'}
        className={`grid place-items-center rounded-2xl bg-ai-500 text-white shadow-[0_4px_0_0] shadow-ai-700 active:translate-y-1 active:shadow-none ${big ? 'h-24 w-24' : 'h-12 w-12'}`}
      >
        <IconSpeaker className={big ? 'h-12 w-12' : 'h-6 w-6'} />
      </button>
      {slow && (
        <button
          type="button"
          onClick={() => speak(text, { slow: true })}
          aria-label="Play slowly"
          className="grid h-14 w-14 place-items-center rounded-2xl bg-ai-400 text-white shadow-[0_4px_0_0] shadow-ai-600 active:translate-y-1 active:shadow-none"
        >
          <IconTurtle className="h-7 w-7" />
        </button>
      )}
    </span>
  );
}
