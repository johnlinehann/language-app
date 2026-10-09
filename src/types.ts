export type ItemType = 'kana' | 'word' | 'phrase' | 'kanji' | 'sentence';

/** One learnable thing: a kana, a word, a phrase or a sentence. */
export interface Item {
  id: string;
  /** Written form (may contain kanji). */
  jp: string;
  /** Reading in kana. Katakana words keep their katakana. */
  kana: string;
  romaji: string;
  /** English meaning(s). The first entry is the canonical one shown to learners. */
  en: string | string[];
  /** Text passed to TTS. */
  audioText: string;
  type: ItemType;
  /** Extra accepted Japanese answers: alternate readings or spellings (kana, kanji or romaji). */
  alt?: string[];
  /** Explicit furigana segments [text, reading]; reading '' means no ruby. Auto-aligned when absent. */
  furigana?: [string, string][];
  /** Word-bank segmentation of `jp`. A token may carry its reading as "学生|がくせい". */
  tokens?: string[];
  /** Picture stand-in for multiple choice. */
  emoji?: string;
  /** Characters with stroke-order data to show when the item is introduced. */
  strokes?: string[];
  /** Short note shown on the intro card (grammar hint etc.). */
  note?: string;
  source?: string;
}

export interface Lesson {
  lesson: string;
  title: string;
  items: Item[];
}

export interface Unit {
  unit: string;
  title: string;
  level: string;
  description?: string;
  lessons: Lesson[];
  checkpoint: boolean;
}

export type Grade = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export enum CardState {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export interface Card {
  itemId: string;
  due: number; // epoch ms
  stability: number; // days
  difficulty: number; // 1..10
  reps: number;
  lapses: number;
  state: CardState;
  lastReview: number | null;
}

export interface Settings {
  romaji: boolean;
  furigana: boolean;
  ttsRate: number;
  voiceURI: string | null;
  sound: boolean;
  dark: 'system' | 'light' | 'dark';
  hearts: boolean;
  dailyGoal: number;
}

export const DEFAULT_SETTINGS: Settings = {
  romaji: true,
  furigana: true,
  ttsRate: 0.9,
  voiceURI: null,
  sound: true,
  dark: 'system',
  hearts: false,
  dailyGoal: 20,
};
