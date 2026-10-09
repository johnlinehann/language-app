import type { ReactNode } from 'react';

export interface Result {
  correct: boolean;
  /** The right answer, shown in the feedback sheet. */
  solution?: ReactNode;
  /** Items missed inside a multi-item exercise (match pairs). */
  missed?: string[];
  /** Advance immediately without a feedback sheet (intro cards, match). */
  silent?: boolean;
}

export interface ExProps<E> {
  ex: E;
  /** True once the answer has been checked — inputs become read-only. */
  locked: boolean;
  /** Register the current answer's checker (or null when nothing is selected yet). */
  setPending: (check: (() => Result) | null) => void;
  /** Complete the exercise without the Check button. */
  finish: (r: Result) => void;
}
