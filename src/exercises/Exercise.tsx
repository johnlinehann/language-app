import type { Exercise as Ex } from '@/lesson/exercises';
import type { ExProps } from './types';
import Intro from './Intro';
import Choice from './Choice';
import TypeAnswer from './TypeAnswer';
import WordBank from './WordBank';
import MatchPairs from './MatchPairs';

/** Dispatches an exercise to its component. */
export default function Exercise(props: ExProps<Ex>) {
  const { ex } = props;
  switch (ex.kind) {
    case 'intro':
      return <Intro {...props} ex={ex} />;
    case 'choice':
    case 'recognize':
    case 'listen-choice':
      return <Choice {...props} ex={ex} />;
    case 'type':
    case 'listen-type':
      return <TypeAnswer {...props} ex={ex} />;
    case 'wordbank':
      return <WordBank {...props} ex={ex} />;
    case 'match':
      return <MatchPairs {...props} ex={ex} />;
  }
}
