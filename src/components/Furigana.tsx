import { itemFurigana, parseToken, alignFurigana, type Segment } from '@/lib/furigana';
import { useSettings } from '@/state/settings';
import type { Item } from '@/types';

/** Japanese text with ruby readings over kanji (when furigana is on). */
export function Furigana({ segments, show, className = '' }: { segments: Segment[]; show?: boolean; className?: string }) {
  const { settings } = useSettings();
  const on = show ?? settings.furigana;
  return (
    <span lang="ja" className={className}>
      {segments.map(([text, ruby], i) =>
        on && ruby ? (
          <ruby key={i}>
            {text}
            <rp>(</rp>
            <rt>{ruby}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i}>{text}</span>
        ),
      )}
    </span>
  );
}

export function ItemJp({ item, className }: { item: Item; className?: string }) {
  return <Furigana segments={itemFurigana(item)} className={className} />;
}

export function TokenJp({ token, className }: { token: string; className?: string }) {
  const { text, reading } = parseToken(token);
  return <Furigana segments={alignFurigana(text, reading)} className={className} />;
}

/** Japanese with optional romaji underneath, following settings. */
export function JpWithRomaji({ item, className = '', romajiClass = '' }: { item: Item; className?: string; romajiClass?: string }) {
  const { settings } = useSettings();
  return (
    <span className="inline-flex flex-col items-center">
      <ItemJp item={item} className={className} />
      {settings.romaji && item.type !== 'kana' && (
        <span className={`text-sm font-normal text-sumi-700/60 dark:text-washi-200/60 ${romajiClass}`}>{item.romaji}</span>
      )}
    </span>
  );
}
