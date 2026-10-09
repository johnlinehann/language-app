import { useLiveQuery } from 'dexie-react-hooks';
import { db, getMeta } from '@/db/db';
import { localDay } from '@/lib/date';
import { currentStreak, EMPTY_STREAK, type StreakState } from '@/gamify/streak';
import { currentHearts, FULL_HEARTS, type HeartsState } from '@/gamify/hearts';
import { useSettings } from '@/state/settings';

export function useToday() {
  const today = localDay();
  const xpToday = useLiveQuery(async () => (await db.xp.where('date').equals(today).toArray()).reduce((a, r) => a + r.xp, 0), [today]) ?? 0;
  const streak = useLiveQuery(() => getMeta<StreakState>('streak', EMPTY_STREAK), []) ?? EMPTY_STREAK;
  const hearts = useLiveQuery(() => getMeta<HeartsState>('hearts', FULL_HEARTS(Date.now())), []);
  return {
    today,
    xpToday,
    streak,
    streakCount: currentStreak(streak, today),
    hearts: hearts ? currentHearts(hearts, Date.now()).count : 5,
  };
}

export function GoalRing({ value, goal, size = 40 }: { value: number; goal: number; size?: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, value / goal);
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} role="img" aria-label={`Daily goal: ${value} of ${goal} XP`}>
      <circle cx="20" cy="20" r={r} fill="none" strokeWidth="5" className="stroke-washi-200 dark:stroke-sumi-700" />
      <circle cx="20" cy="20" r={r} fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)}
        transform="rotate(-90 20 20)" className={p >= 1 ? 'stroke-matcha-500' : 'stroke-kin-400'} style={{ transition: 'stroke-dashoffset .6s' }} />
      <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-current">{p >= 1 ? '✓' : value}</text>
    </svg>
  );
}

export function StatusBar() {
  const { settings } = useSettings();
  const { xpToday, streakCount, streak, hearts } = useToday();
  return (
    <div className="flex items-center justify-between gap-3 text-lg font-bold">
      <span className="flex items-center gap-1 text-shu-500" aria-label={`${streakCount} day streak, ${streak.freezes} streak freezes`}>
        <span aria-hidden>🔥</span>
        {streakCount}
        {streak.freezes > 0 && <span className="ml-1 text-sm text-ai-400" aria-hidden>🧊{streak.freezes}</span>}
      </span>
      {settings.hearts && (
        <span className="flex items-center gap-1 text-rose-500" aria-label={`${hearts} hearts`}>
          <span aria-hidden>❤</span>
          {hearts}
        </span>
      )}
      <span className="flex items-center gap-2 text-sm text-sumi-700/70 dark:text-washi-200/70">
        <GoalRing value={xpToday} goal={settings.dailyGoal} />
        <span>{xpToday}/{settings.dailyGoal} XP</span>
      </span>
    </div>
  );
}
