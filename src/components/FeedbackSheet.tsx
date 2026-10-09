import type { ReactNode } from 'react';
import { IconCheck, IconX } from './Icons';

const PRAISE = ['Nice!', 'Great job!', 'Correct!', 'すごい!', 'Excellent!', 'You got it!'];

export function FeedbackSheet({ correct, solution, onContinue }: { correct: boolean; solution?: ReactNode; onContinue: () => void }) {
  const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
  return (
    <div
      role="alert"
      className={`safe-bottom fixed inset-x-0 bottom-0 z-30 animate-slideup border-t-2 px-4 pt-4 ${
        correct ? 'border-matcha-100 bg-matcha-50 text-matcha-600 dark:border-matcha-600 dark:bg-[#1c2a15] dark:text-matcha-400' : 'border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-[#2c1418] dark:text-rose-300'
      }`}
    >
      <div className="mx-auto flex max-w-lg flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white dark:bg-sumi-900`}>
            {correct ? <IconCheck className="h-6 w-6" /> : <IconX className="h-6 w-6" />}
          </span>
          <div className="min-w-0">
            <p className="text-xl font-extrabold">{correct ? praise : 'Not quite'}</p>
            {solution && (
              <div className="mt-1 text-base">
                <span className="font-bold">{correct ? 'Meaning: ' : 'Correct answer: '}</span>
                {solution}
              </div>
            )}
          </div>
        </div>
        <button type="button" autoFocus onClick={onContinue} className={`${correct ? 'btn-success' : 'btn-danger'} w-full`}>
          Continue <span className="kbd">Enter</span>
        </button>
      </div>
    </div>
  );
}
