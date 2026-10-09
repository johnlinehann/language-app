/** Musubi, Kotoba's rice-ball mascot. */
export function Mascot({ mood = 'happy', size = 96, className = '' }: { mood?: 'happy' | 'cheer' | 'sad' | 'think'; size?: number; className?: string }) {
  const mouth =
    mood === 'sad' ? 'M27 46q5-5 10 0' : mood === 'think' ? 'M28 45h8' : mood === 'cheer' ? 'M26 42q6 9 12 0z' : 'M27 43q5 5 10 0';
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <path d="M32 5c5 0 9 3 12 8l14 27c4 8-2 18-11 18H17C8 58 2 48 6 40l14-27c3-5 7-8 12-8z" className="fill-white stroke-sumi-700 dark:fill-washi-100" strokeWidth="2.5" />
      <rect x="17" y="47" width="30" height="13" rx="3" className="fill-ai-700" />
      <text x="32" y="57.5" fontSize="9" textAnchor="middle" fill="#fffaf3" fontWeight="700">ことば</text>
      {mood === 'think' ? (
        <>
          <path d="M22 32h6M36 32h6" stroke="#2b2b33" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="25" cy="32" r="2.8" fill="#2b2b33" />
          <circle cx="39" cy="32" r="2.8" fill="#2b2b33" />
        </>
      )}
      <circle cx="20" cy="38" r="2.6" fill="#f07a5e" opacity=".55" />
      <circle cx="44" cy="38" r="2.6" fill="#f07a5e" opacity=".55" />
      <path d={mouth} stroke="#2b2b33" strokeWidth="2.2" fill={mood === 'cheer' ? '#e8553d' : 'none'} strokeLinecap="round" />
      {mood === 'cheer' && <path d="M8 18l-4-3M10 12l-2-5M56 18l4-3M54 12l2-5" stroke="#e09b1d" strokeWidth="2.5" strokeLinecap="round" />}
    </svg>
  );
}
