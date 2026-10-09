import { useEffect } from 'react';
import type { SessionSummary } from '@/db/progress';
import type { SessionKind } from '@/gamify/xp';
import { Mascot } from '@/components/Mascot';

const TITLES: Record<SessionKind, string> = {
  lesson: 'Lesson complete!',
  checkpoint: 'Checkpoint passed!',
  practice: 'Practice complete!',
};

export default function CompleteScreen({ summary, kind, seconds, onDone }: { summary: SessionSummary; kind: SessionKind; seconds: number; onDone: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Enter' && onDone();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onDone]);
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');
  const perfect = summary.accuracy === 1;
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <Mascot mood="cheer" size={140} className="animate-pop" />
      <div>
        <h1 className="text-3xl font-extrabold text-kin-500">{TITLES[kind]}</h1>
        {perfect && <p className="mt-1 font-bold text-ai-500">Perfect — no mistakes! 💎</p>}
      </div>
      <dl className="grid w-full grid-cols-3 gap-3">
        <Stat label="Total XP" value={`+${summary.xp}`} tone="kin" />
        <Stat label="Accuracy" value={`${Math.round(summary.accuracy * 100)}%`} tone="matcha" />
        <Stat label="Time" value={`${mm}:${ss}`} tone="ai" />
      </dl>
      <ul className="flex w-full flex-col gap-2 text-left">
        {summary.streakExtended && <Note icon="🔥">{summary.streak}-day streak!{summary.usedFreezes > 0 && ` A streak freeze saved you (${summary.usedFreezes} used).`}</Note>}
        {summary.freezeEarned && <Note icon="🧊">You earned a streak freeze for practising.</Note>}
        {summary.goalReached && <Note icon="🎯">Daily goal reached — {summary.todayXp} XP today.</Note>}
        {summary.achievements.map((a) => (
          <Note key={a.id} icon={a.icon}>
            <b>Achievement unlocked:</b> {a.title}
          </Note>
        ))}
      </ul>
      <button type="button" className="btn-primary w-full" onClick={onDone} autoFocus>
        Continue <span className="kbd">Enter</span>
      </button>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'kin' | 'matcha' | 'ai' }) {
  const color = { kin: 'border-kin-400 bg-kin-400', matcha: 'border-matcha-500 bg-matcha-500', ai: 'border-ai-500 bg-ai-500' }[tone];
  return (
    <div className={`overflow-hidden rounded-2xl border-2 ${color}`}>
      <dt className="px-2 py-1 text-xs font-extrabold uppercase text-white">{label}</dt>
      <dd className="bg-white py-3 text-xl font-extrabold dark:bg-sumi-800">{value}</dd>
    </div>
  );
}

function Note({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <li className="card flex animate-pop items-center gap-3 p-3">
      <span className="text-2xl" aria-hidden>{icon}</span>
      <span>{children}</span>
    </li>
  );
}
