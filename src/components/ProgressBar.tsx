export function ProgressBar({ value, label = 'Lesson progress' }: { value: number; label?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-4 flex-1 overflow-hidden rounded-full bg-washi-200 dark:bg-sumi-700">
      <div className="relative h-full rounded-full bg-matcha-500 transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }}>
        <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
