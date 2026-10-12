declare module 'virtual:strokes' {
  /** Stroke path data per character, keyed by 5-digit hex codepoint (KanjiVG file name). Empty unless inlined. */
  const strokes: Record<string, string[]>;
  export default strokes;
}
