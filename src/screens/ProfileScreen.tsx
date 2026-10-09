import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getMeta } from '@/db/db';
import { computeStats } from '@/db/progress';
import { ACHIEVEMENTS, type Stats } from '@/gamify/achievements';
import { DAILY_GOALS } from '@/gamify/xp';
import { addDays, localDay } from '@/lib/date';
import { useSettings } from '@/state/settings';
import { useToday, GoalRing } from '@/components/StatusBar';
import { Mascot } from '@/components/Mascot';

export default function ProfileScreen() {
  const { settings, update } = useSettings();
  const { xpToday, streakCount, streak } = useToday();
  const xpRows = useLiveQuery(() => db.xp.toArray(), []);
  const unlocked = useLiveQuery(() => getMeta<Record<string, string>>('achievements', {}), []) ?? {};
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    void computeStats().then(setStats);
  }, [xpRows?.length]);

  const today = localDay();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((d) => ({
    day: d,
    xp: (xpRows ?? []).filter((r) => r.date === d).reduce((a, r) => a + r.xp, 0),
  }));

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-6">
      <div className="flex items-center gap-4">
        <Mascot size={72} />
        <div>
          <h1 className="text-2xl font-extrabold">Your progress</h1>
          <p className="text-sm opacity-70">Stored only on this device. No account needed.</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <Stat icon="🔥" label="Day streak" value={streakCount} sub={`Longest ${streak.longest} · 🧊 ${streak.freezes}`} />
        <Stat icon="⭐" label="Total XP" value={stats?.totalXp ?? 0} />
        <Stat icon="📘" label="Lessons" value={stats?.lessonsCompleted ?? 0} sub={`${stats?.checkpoints ?? 0} checkpoints`} />
        <Stat icon="🧠" label="Items learned" value={stats?.itemsLearned ?? 0} />
      </dl>

      <section className="card mt-5 p-4" aria-labelledby="goal-h">
        <div className="flex items-center justify-between">
          <h2 id="goal-h" className="font-extrabold">Daily goal</h2>
          <span className="flex items-center gap-2 text-sm font-bold">
            <GoalRing value={xpToday} goal={settings.dailyGoal} size={32} /> {xpToday}/{settings.dailyGoal} XP
          </span>
        </div>
        <div role="radiogroup" aria-labelledby="goal-h" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DAILY_GOALS.map((g) => (
            <button
              key={g.xp}
              type="button"
              role="radio"
              aria-checked={settings.dailyGoal === g.xp}
              onClick={() => void update({ dailyGoal: g.xp })}
              className="option min-h-[52px] flex-col items-center justify-center gap-0 py-2 text-center text-base"
            >
              <span className="font-bold">{g.label}</span>
              <span className="text-xs opacity-70">{g.xp} XP/day</span>
            </button>
          ))}
        </div>
      </section>

      <WeekChart week={week} goal={settings.dailyGoal} />

      <section className="mt-5" aria-labelledby="ach-h">
        <h2 id="ach-h" className="mb-2 font-extrabold">
          Achievements <span className="text-sm font-bold opacity-60">{Object.keys(unlocked).length}/{ACHIEVEMENTS.length}</span>
        </h2>
        <ul className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked[a.id];
            return (
              <li key={a.id} className={`card flex items-center gap-3 p-3 ${got ? '' : 'opacity-50 grayscale'}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-kin-400/20 text-2xl font-bold" aria-hidden>
                  {a.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold">{a.title}</span>
                  <span className="block text-xs opacity-70">{a.description}</span>
                  <span className="sr-only">{got ? `Unlocked ${new Date(got).toLocaleDateString()}` : 'Locked'}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: string; label: string; value: number; sub?: string }) {
  return (
    <div className="card p-3">
      <dt className="flex items-center gap-1 text-xs font-bold uppercase opacity-60">
        <span aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className="text-2xl font-extrabold">{value.toLocaleString()}</dd>
      {sub && <dd className="text-xs opacity-60">{sub}</dd>}
    </div>
  );
}

/** Single-series bar chart of XP over the last 7 days, with the goal as a reference line. */
function WeekChart({ week, goal }: { week: { day: string; xp: number }[]; goal: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(goal, ...week.map((w) => w.xp), 1);
  const H = 120;
  const label = (d: string) => new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short' });
  return (
    <section className="card mt-5 p-4" aria-labelledby="week-h">
      <h2 id="week-h" className="font-extrabold">XP this week</h2>
      <div className="relative mt-3" style={{ height: H + 24 }}>
        {/* goal reference line */}
        <div className="absolute inset-x-0 border-t-2 border-dashed border-washi-200 dark:border-sumi-700" style={{ top: H - (goal / max) * H }} aria-hidden>
          <span className="absolute -top-5 right-0 text-xs font-bold opacity-60">goal {goal}</span>
        </div>
        <div className="absolute inset-x-0 top-0 flex items-end justify-between gap-2" style={{ height: H }} aria-hidden>
          {week.map((w, i) => (
            <div
              key={w.day}
              className="relative flex h-full flex-1 items-end justify-center"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <div
                className={`w-full max-w-[28px] rounded-t ${i === 6 ? 'bg-ai-500 dark:bg-ai-400' : 'bg-ai-400/70 dark:bg-ai-400/60'}`}
                style={{ height: Math.max(w.xp ? 4 : 0, (w.xp / max) * H) }}
              />
              {(hover === i || (i === 6 && hover === null && w.xp > 0)) && (
                <span className="absolute -top-1 -translate-y-full rounded-md bg-sumi-800 px-1.5 py-0.5 text-xs font-bold text-white dark:bg-washi-100 dark:text-sumi-900">
                  {w.xp} XP
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-between gap-2 text-center text-xs opacity-60" aria-hidden>
          {week.map((w) => (
            <span key={w.day} className="flex-1">{label(w.day)}</span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>XP earned per day, last 7 days</caption>
        <tbody>
          {week.map((w) => (
            <tr key={w.day}>
              <th scope="row">{w.day}</th>
              <td>{w.xp} XP</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
