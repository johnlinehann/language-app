import { useEffect, useState } from 'react';

const cache = new Map<string, Promise<string[]>>();
const file = (ch: string) => `/kanjivg/${ch.codePointAt(0)!.toString(16).padStart(5, '0')}.svg`;

/** Stroke path data in order, parsed from a KanjiVG SVG. */
export function parseStrokes(svg: string): string[] {
  return [...svg.matchAll(/<path[^>]*\sid="kvg:[0-9a-f]+-s\d+"[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
}

function loadStrokes(ch: string): Promise<string[]> {
  if (!cache.has(ch))
    cache.set(
      ch,
      fetch(file(ch))
        .then((r) => (r.ok ? r.text() : ''))
        .then(parseStrokes)
        .catch(() => []),
    );
  return cache.get(ch)!;
}

/** Animated stroke-order diagram (KanjiVG data, CC BY-SA). */
export function StrokeOrder({ char, size = 140, speed = 0.55 }: { char: string; size?: number; speed?: number }) {
  const [paths, setPaths] = useState<string[] | null>(null);
  const [run, setRun] = useState(0);
  useEffect(() => {
    let live = true;
    loadStrokes(char).then((p) => live && setPaths(p));
    return () => {
      live = false;
    };
  }, [char]);

  if (paths && paths.length === 0) return null;
  return (
    <figure className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="card grid place-items-center p-1"
        aria-label={`Stroke order for ${char}${paths ? `, ${paths.length} strokes` : ''}. Tap to replay.`}
      >
        <svg key={run} viewBox="0 0 109 109" width={size} height={size} aria-hidden="true">
          <path d="M54.5 4v101M4 54.5h101" className="stroke-washi-200 dark:stroke-sumi-700" strokeDasharray="3 3" />
          {paths?.map((d, i) => (
            <path key={`bg${i}`} d={d} fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-washi-200 dark:stroke-sumi-700" />
          ))}
          {paths?.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              className="stroke-sumi-800 dark:stroke-washi-100"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: `kvg-draw ${speed}s ease-in-out ${i * speed}s forwards`,
              }}
            />
          ))}
        </svg>
      </button>
      <figcaption className="text-xs opacity-60">{paths ? `${paths.length} strokes · tap to replay` : 'Loading…'}</figcaption>
    </figure>
  );
}
