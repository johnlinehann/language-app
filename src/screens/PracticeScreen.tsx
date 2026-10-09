import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { ITEMS } from '@/data/course';
import { cardRetrievability } from '@/srs/fsrs';
import { countDue, MIN_PRACTICE_ITEMS, PRACTICE_SIZE } from '@/srs/review';
import { ItemJp } from '@/components/Furigana';
import { Mascot } from '@/components/Mascot';
import { meaningOf } from '@/exercises/shared';
import { useToday } from '@/components/StatusBar';
import { MAX_FREEZES } from '@/gamify/streak';
import { CardState } from '@/types';

export default function PracticeScreen() {
  const cards = useLiveQuery(() => db.cards.toArray(), []);
  const { streak } = useToday();
  if (!cards) return null;
  const now = Date.now();
  const learned = cards.filter((c) => c.lastReview !== null && ITEMS.has(c.itemId));
  const due = countDue(learned, now);
  const mature = learned.filter((c) => c.state === CardState.Review && c.stability >= 21).length;
  const weakest = learned
    .map((c) => ({ c, r: cardRetrievability(c, now) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 8);
  const canPractice = learned.length >= MIN_PRACTICE_ITEMS;

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-6">
      <h1 className="text-2xl font-extrabold">Practice</h1>
      <p className="mt-1 opacity-70">Spaced repetition (FSRS) brings words back right before you'd forget them.</p>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Tile n={due} label="Due now" accent="text-shu-500" />
        <Tile n={learned.length} label="Learned" accent="text-ai-500" />
        <Tile n={mature} label="Mastered" accent="text-matcha-500" />
      </div>

      <div className="card mt-5 flex flex-col items-center gap-3 p-6 text-center">
        <Mascot mood={due ? 'happy' : 'cheer'} size={80} />
        {canPractice ? (
          <>
            <p className="font-bold">
              {due > 0 ? `${Math.min(due, PRACTICE_SIZE)} reviews ready.` : 'Nothing is due — practise your weakest words.'}
            </p>
            <p className="text-sm opacity-70">
              Finishing a practice session refills hearts and earns a streak freeze 🧊 ({streak.freezes}/{MAX_FREEZES}, one per day).
            </p>
            <Link to="/lesson/practice" className="btn-primary w-full">
              Start practice
            </Link>
          </>
        ) : (
          <>
            <p className="font-bold">Learn a few more items first.</p>
            <p className="text-sm opacity-70">Practice unlocks after {MIN_PRACTICE_ITEMS} learned items.</p>
            <Link to="/" className="btn-ghost w-full">Go to lessons</Link>
          </>
        )}
      </div>

      {weakest.length > 0 && (
        <section className="mt-6" aria-labelledby="weak-h">
          <h2 id="weak-h" className="mb-2 font-extrabold">Weakest items</h2>
          <ul className="card divide-y-2 divide-washi-200 dark:divide-sumi-700">
            {weakest.map(({ c, r }) => {
              const it = ITEMS.get(c.itemId)!;
              const pct = Math.round(r * 100);
              return (
                <li key={c.itemId} className="flex items-center gap-3 px-4 py-3">
                  <ItemJp item={it} className="min-w-[4rem] text-xl font-bold" />
                  <span className="flex-1 truncate text-sm opacity-80">{meaningOf(it)}</span>
                  <span className="w-24" aria-label={`Recall ${pct}%`}>
                    <span className="block h-2 overflow-hidden rounded-full bg-washi-200 dark:bg-sumi-700">
                      <span className={`block h-full ${pct < 70 ? 'bg-shu-500' : pct < 90 ? 'bg-kin-400' : 'bg-matcha-500'}`} style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Tile({ n, label, accent }: { n: number; label: string; accent: string }) {
  return (
    <div className="card p-3">
      <div className={`text-2xl font-extrabold ${accent}`}>{n}</div>
      <div className="text-xs font-bold uppercase opacity-60">{label}</div>
    </div>
  );
}
