import type { Item } from '@/types';

export type Dir = 'jp2en' | 'en2jp';

interface Base {
  id: string;
}

/** Teaching card for a new item: reading, meaning, audio and stroke order. Not graded. */
export interface IntroEx extends Base { kind: 'intro'; item: Item }
/** Multiple choice. jp2en: Japanese prompt → pick meaning. en2jp: meaning (and picture) → pick Japanese. */
export interface ChoiceEx extends Base { kind: 'choice'; item: Item; dir: Dir; options: Item[] }
/** Kana / kanji recognition: big character → pick its reading. */
export interface RecognizeEx extends Base { kind: 'recognize'; item: Item; options: Item[] }
/** Build the translation by tapping tiles. `answer` is the canonical tile sequence. */
export interface WordBankEx extends Base { kind: 'wordbank'; item: Item; dir: Dir; tiles: string[]; answer: string[] }
/** Free typing. en2jp uses romaji→kana conversion; jp2en types English (or romaji for kana). */
export interface TypeEx extends Base { kind: 'type'; item: Item; dir: Dir }
export interface ListenChoiceEx extends Base { kind: 'listen-choice'; item: Item; options: Item[] }
export interface ListenTypeEx extends Base { kind: 'listen-type'; item: Item }
export interface MatchEx extends Base { kind: 'match'; items: Item[] }

export type Exercise = IntroEx | ChoiceEx | RecognizeEx | WordBankEx | TypeEx | ListenChoiceEx | ListenTypeEx | MatchEx;
export type ExerciseKind = Exercise['kind'];

export const isGraded = (ex: Exercise) => ex.kind !== 'intro';
export const exerciseItems = (ex: Exercise): Item[] => (ex.kind === 'match' ? ex.items : [ex.item]);
