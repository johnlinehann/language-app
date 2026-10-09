import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@/db/db';
import { ITEMS, findLesson, itemsBefore } from '@/data/course';
import { generateLesson } from '@/lesson/generate';
import { advance, answer, current, initQueue, isFinished, progress, type QueueState } from '@/lesson/queue';
import { pickPracticeItems, MIN_PRACTICE_ITEMS } from '@/srs/review';
import { finishSession, getHearts, spendHeart, type SessionSummary } from '@/db/progress';
import type { SessionKind } from '@/gamify/xp';
import { sfx } from '@/audio/sfx';
import { useSettings } from '@/state/settings';
import { ProgressBar } from '@/components/ProgressBar';
import { FeedbackSheet } from '@/components/FeedbackSheet';
import { IconX } from '@/components/Icons';
import { Mascot } from '@/components/Mascot';
import Exercise from '@/exercises/Exercise';
import type { Result } from '@/exercises/types';
import CompleteScreen from './CompleteScreen';

type Phase = 'loading' | 'empty' | 'play' | 'saving' | 'done' | 'no-hearts';

export default function LessonScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const [phase, setPhase] = useState<Phase>('loading');
  const [q, setQ] = useState<QueueState | null>(null);
  const [kind, setKind] = useState<SessionKind>('lesson');
  const [feedback, setFeedback] = useState<Result | null>(null);
  const [pending, setPendingState] = useState<(() => Result) | null>(null);
  const [hearts, setHearts] = useState(5);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const started = useRef(Date.now());

  const setPending = useCallback((fn: (() => Result) | null) => setPendingState(() => fn), []);

  // Build the exercise list once per visit.
  useEffect(() => {
    let live = true;
    (async () => {
      const h = await getHearts();
      if (!live) return;
      setHearts(h.count);
      if (id === 'practice') {
        const cards = await db.cards.toArray();
        const items = pickPracticeItems(cards, ITEMS, Date.now());
        if (items.length < MIN_PRACTICE_ITEMS) return live && setPhase('empty');
        const pool = cards.map((c) => ITEMS.get(c.itemId)).filter((x) => !!x);
        setKind('practice');
        setQ(initQueue(generateLesson(items, { pool, introduce: false })));
      } else {
        const node = findLesson(id);
        if (!node) return navigate('/', { replace: true });
        const k: SessionKind = node.checkpoint ? 'checkpoint' : 'lesson';
        if (settings.hearts && h.count === 0) return live && setPhase('no-hearts');
        setKind(k);
        const done = await db.lessons.get(id);
        setQ(
          initQueue(
            generateLesson(node.lesson.items, {
              pool: itemsBefore(node.order),
              introduce: !node.checkpoint && !done,
            }),
          ),
        );
      }
      setPhase('play');
      started.current = Date.now();
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const ex = q ? current(q) : undefined;
  // Dev-only hook used by the end-to-end smoke test.
  if (import.meta.env.DEV) (window as unknown as { __kotobaEx?: unknown }).__kotobaEx = ex;
  const heartsOn = settings.hearts && kind !== 'practice';

  const complete = useCallback(
    async (state: QueueState) => {
      setPhase('saving');
      sfx.complete();
      const s = await finishSession({
        kind,
        lessonId: id,
        items: new Map(Object.entries(state.items)),
        graded: state.total,
        mistakes: state.mistakes,
      });
      setSummary(s);
      setPhase('done');
    },
    [id, kind],
  );

  const next = useCallback(
    (state: QueueState) => {
      setFeedback(null);
      setPendingState(null);
      const s = advance(state);
      setQ(s);
      if (isFinished(s)) void complete(s);
    },
    [complete],
  );

  const resolve = useCallback(
    async (r: Result) => {
      if (!q) return;
      const s = answer(q, r.correct, r.missed);
      setQ(s);
      if (r.silent) return next(s);
      if (r.correct) sfx.correct();
      else {
        sfx.wrong();
        if (heartsOn) {
          const h = await spendHeart();
          setHearts(h.count);
        }
      }
      setFeedback(r);
    },
    [q, next, heartsOn],
  );

  const check = useCallback(() => pending && resolve(pending()), [pending, resolve]);
  const cont = useCallback(() => {
    if (!q) return;
    if (heartsOn && hearts === 0) return setPhase('no-hearts');
    next(q);
  }, [q, next, heartsOn, hearts]);

  // Enter = Check / Continue
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || phase !== 'play' || confirmQuit) return;
      if (feedback) {
        e.preventDefault();
        cont();
      } else if (pending) {
        e.preventDefault();
        void check();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase, feedback, pending, check, cont, confirmQuit]);

  if (phase === 'done' && summary && q)
    return <CompleteScreen summary={summary} kind={kind} seconds={Math.round((Date.now() - started.current) / 1000)} onDone={() => navigate(kind === 'practice' ? '/practice' : '/')} />;

  if (phase === 'empty')
    return (
      <Centered>
        <Mascot mood="think" />
        <p className="text-lg font-bold">Nothing to practise yet.</p>
        <p className="opacity-70">Finish a lesson or two first — your learned words will show up here.</p>
        <button type="button" className="btn-primary w-full" onClick={() => navigate('/')}>Back to lessons</button>
      </Centered>
    );

  if (phase === 'no-hearts')
    return (
      <Centered>
        <Mascot mood="sad" />
        <p className="text-xl font-extrabold">Out of hearts</p>
        <p className="opacity-70">Hearts refill one every 30 minutes — or do a Practice session to refill them all now. (You can turn hearts off in Settings.)</p>
        <button type="button" className="btn-primary w-full" onClick={() => navigate('/lesson/practice')}>Practice to refill</button>
        <button type="button" className="btn-ghost w-full" onClick={() => navigate('/')}>Quit</button>
      </Centered>
    );

  if (!q || !ex || phase === 'loading')
    return (
      <Centered>
        <Mascot mood="think" className="animate-pulse" />
      </Centered>
    );

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4">
      <header className="flex items-center gap-3 py-4">
        <button type="button" onClick={() => setConfirmQuit(true)} aria-label="Quit lesson" className="grid h-11 w-11 place-items-center rounded-xl opacity-60 hover:opacity-100">
          <IconX />
        </button>
        <ProgressBar value={progress(q)} />
        <button
          type="button"
          onClick={() => void update({ furigana: !settings.furigana })}
          aria-pressed={settings.furigana}
          aria-label="Show furigana (readings over kanji)"
          title="Furigana"
          className={`h-10 rounded-xl border-2 px-2 text-sm font-bold ${settings.furigana ? 'border-ai-400 text-ai-500' : 'border-washi-200 opacity-50 dark:border-sumi-700'}`}
        >
          <ruby lang="ja">
            字<rt>じ</rt>
          </ruby>
        </button>
        {heartsOn && (
          <span className="flex items-center gap-1 font-bold text-rose-500" aria-label={`${hearts} hearts left`}>
            <span aria-hidden>❤</span>
            {hearts}
          </span>
        )}
      </header>

      <section key={ex.id} className="flex-1 animate-pop pb-40 pt-2" aria-live="polite">
        <Exercise ex={ex} locked={!!feedback} setPending={setPending} finish={resolve} />
      </section>

      {!feedback && ex.kind !== 'intro' && ex.kind !== 'match' && (
        <footer className="safe-bottom fixed inset-x-0 bottom-0 border-t-2 border-washi-200 bg-washi-50 px-4 pt-4 dark:border-sumi-700 dark:bg-sumi-900">
          <div className="mx-auto max-w-lg">
            <button type="button" className="btn-primary w-full" disabled={!pending} onClick={() => void check()}>
              Check <span className="kbd">Enter</span>
            </button>
          </div>
        </footer>
      )}
      {feedback && <FeedbackSheet correct={feedback.correct} solution={feedback.solution} onContinue={cont} />}

      {confirmQuit && (
        <div role="dialog" aria-modal="true" aria-labelledby="quit-title" className="fixed inset-0 z-40 grid place-items-end bg-black/40 sm:place-items-center">
          <div className="card safe-bottom w-full max-w-lg animate-slideup rounded-b-none p-6 text-center sm:rounded-2xl">
            <Mascot mood="sad" size={72} className="mx-auto" />
            <p id="quit-title" className="my-3 text-lg font-extrabold">Quit now? You'll lose this lesson's progress.</p>
            <div className="flex flex-col gap-3">
              <button type="button" className="btn-primary" autoFocus onClick={() => setConfirmQuit(false)}>Keep learning</button>
              <button type="button" className="btn-ghost text-rose-500" onClick={() => navigate(-1)}>Quit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-[100dvh] max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">{children}</div>;
}
