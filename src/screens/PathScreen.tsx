import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { PATH, UNITS, isUnlocked, type LessonRef } from '@/data/course';
import { countDue } from '@/srs/review';
import { StatusBar } from '@/components/StatusBar';
import { Mascot } from '@/components/Mascot';
import { IconCheck, IconLock, IconRepeat, IconStar } from '@/components/Icons';

const UNIT_COLORS = ['bg-shu-500', 'bg-ai-500', 'bg-matcha-500', 'bg-kin-500', 'bg-ai-700'];
// Horizontal offsets (px) that make the path wind like a mountain trail.
const WIND = [0, 56, 84, 56, 0, -56, -84, -56];

/** Kana units are all "Unit 0"; topic units count from 1 (u02 → Unit 1). */
const unitLabel = (id: string, level: string) => (level === 'Kana' ? 'Unit 0' : `Unit ${parseInt(id.slice(1), 10) - 1}`);

export default function PathScreen() {
  const navigate = useNavigate();
  const records = useLiveQuery(() => db.lessons.toArray(), []);
  const due = useLiveQuery(async () => countDue(await db.cards.toArray(), Date.now()), []) ?? 0;
  const completed = useMemo(() => new Set((records ?? []).map((r) => r.lessonId)), [records]);
  const current = PATH.find((n) => !completed.has(n.lesson.lesson)) ?? null;
  const [open, setOpen] = useState<string | null>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (records) currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [records === undefined]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 pb-32">
      <header className="sticky top-0 z-10 -mx-4 bg-washi-50/95 px-4 py-3 backdrop-blur dark:bg-sumi-900/95">
        <StatusBar />
      </header>

      {completed.size > 0 && (
        <Link to="/practice" className="card mt-2 flex items-center gap-3 p-4 transition-transform active:scale-[.98]">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-ai-50 text-ai-500 dark:bg-ai-900">
            <IconRepeat />
          </span>
          <span className="flex-1">
            <span className="block font-bold">Practice</span>
            <span className="text-sm opacity-70">{due > 0 ? `${due} item${due === 1 ? '' : 's'} due for review` : 'Strengthen weak words'}</span>
          </span>
          {due > 0 && <span className="rounded-full bg-shu-500 px-2.5 py-0.5 text-sm font-bold text-white">{due}</span>}
        </Link>
      )}

      {UNITS.map((unit, ui) => {
        const nodes = PATH.filter((n) => n.unit === unit);
        return (
          <section key={unit.unit} aria-labelledby={`unit-${unit.unit}`} className="mt-6">
            <div className={`${UNIT_COLORS[ui % UNIT_COLORS.length]} rounded-2xl p-4 text-white shadow-[0_4px_0_0_rgba(0,0,0,.18)]`}>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                {unitLabel(unit.unit, unit.level)} · {unit.level}
              </p>
              <h2 id={`unit-${unit.unit}`} className="text-xl font-extrabold">
                {unit.title}
              </h2>
              {unit.description && <p className="mt-1 text-sm opacity-90">{unit.description}</p>}
            </div>
            <ol className="relative mt-6 flex flex-col items-center gap-5">
              {nodes.map((n, i) => (
                <PathNode
                  key={n.lesson.lesson}
                  node={n}
                  offset={WIND[i % WIND.length]}
                  done={completed.has(n.lesson.lesson)}
                  isCurrent={current?.lesson.lesson === n.lesson.lesson}
                  unlocked={isUnlocked(n.order, completed)}
                  open={open === n.lesson.lesson}
                  onToggle={() => setOpen(open === n.lesson.lesson ? null : n.lesson.lesson)}
                  onStart={() => navigate(`/lesson/${n.lesson.lesson}`)}
                  buttonRef={current?.lesson.lesson === n.lesson.lesson ? currentRef : undefined}
                />
              ))}
            </ol>
          </section>
        );
      })}

      {!current && records && (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <Mascot mood="cheer" />
          <p className="font-bold">You finished every unit! Keep practising to stay sharp.</p>
        </div>
      )}
    </div>
  );
}

function PathNode(props: {
  node: LessonRef;
  offset: number;
  done: boolean;
  isCurrent: boolean;
  unlocked: boolean;
  open: boolean;
  onToggle: () => void;
  onStart: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  const { node, offset, done, isCurrent, unlocked, open, onToggle, onStart, buttonRef } = props;
  const cp = node.checkpoint;
  const state = done ? 'completed' : isCurrent ? 'current' : unlocked ? 'unlocked' : 'locked';
  const color = done
    ? 'bg-kin-400 shadow-kin-500 text-white'
    : isCurrent || unlocked
      ? 'bg-shu-500 shadow-shu-700 text-white'
      : 'bg-washi-200 shadow-washi-200/60 text-sumi-700/40 dark:bg-sumi-700 dark:shadow-sumi-800 dark:text-washi-100/40';
  const popId = `pop-${node.lesson.lesson}`;
  return (
    <li className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
      {isCurrent && !open && (
        <span className="mb-2 animate-bounce rounded-xl border-2 border-washi-200 bg-white px-3 py-1 text-sm font-extrabold uppercase text-shu-500 dark:border-sumi-700 dark:bg-sumi-800">
          Start
        </span>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={popId}
        aria-label={`${cp ? 'Checkpoint' : 'Lesson'}: ${node.lesson.title} (${state})`}
        className={`grid ${cp ? 'h-20 w-20 rounded-3xl' : 'h-[72px] w-[72px] rounded-full'} place-items-center shadow-[0_6px_0_0] transition-transform active:translate-y-1 active:shadow-none ${color} ${isCurrent ? 'ring-4 ring-shu-100 dark:ring-shu-700/40' : ''}`}
      >
        {cp ? (
          <span className="text-3xl" aria-hidden>⛩️</span>
        ) : done ? (
          <IconCheck className="h-9 w-9" />
        ) : unlocked ? (
          <IconStar className="h-9 w-9 fill-current" />
        ) : (
          <IconLock className="h-8 w-8" />
        )}
      </button>
      {open && (
        <div id={popId} role="dialog" aria-label={node.lesson.title} className="card absolute top-full z-10 mt-3 w-64 animate-pop p-4 shadow-lg">
          <p className="font-extrabold">{node.lesson.title}</p>
          <p className="mb-3 text-sm opacity-70">
            {cp
              ? 'Test everything in this unit.'
              : `${node.lesson.items.length} new item${node.lesson.items.length === 1 ? '' : 's'}`}
          </p>
          {unlocked ? (
            <button type="button" className="btn-primary w-full" onClick={onStart} autoFocus>
              {done ? 'Review +XP' : cp ? 'Take test' : 'Start'}
            </button>
          ) : (
            <p className="text-sm font-bold opacity-60">Finish the lessons before this one to unlock it.</p>
          )}
        </div>
      )}
    </li>
  );
}
