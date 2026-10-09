// Tatoeba (CC BY 2.0 FR) example sentences: Japanese sentences linked to English translations.
export const TATOEBA = {
  jpn: 'https://downloads.tatoeba.org/exports/per_language/jpn/jpn_sentences.tsv.bz2',
  eng: 'https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2',
  links: 'https://downloads.tatoeba.org/exports/per_language/jpn/jpn-eng_links.tsv.bz2',
};

/** Read "id\tlang\ttext" lines into Map<id, text>, keeping only rows passing `keep`. */
export async function loadSentences(lines, keep = () => true) {
  const m = new Map();
  for await (const line of lines) {
    const [id, , text] = line.split('\t');
    if (text && keep(text)) m.set(id, text);
  }
  return m;
}

/** Pair Japanese sentences with their first English translation. */
export async function loadPairs(linkLines, jpn, eng) {
  const pairs = [];
  const seen = new Set();
  for await (const line of linkLines) {
    const [a, b] = line.split('\t');
    if (seen.has(a) || !jpn.has(a) || !eng.has(b)) continue;
    seen.add(a);
    pairs.push({ id: a, jp: jpn.get(a), en: eng.get(b) });
  }
  return pairs;
}

const KANJI = /[㐀-鿿々]/;
const KANA_ONLY = /^[぀-ヿー]+$/;

/**
 * Conservative segmenter: greedy longest match against a lexicon of known words
 * (form → reading). A kanji-containing span is only accepted if the lexicon knows
 * its reading unambiguously; leftover kana stays as-is. Returns tokens like
 * "学生|がくせい" or null if the sentence can't be read with confidence.
 */
export function segment(sentence, lexicon, maxLen = 8) {
  const text = sentence.replace(/[。！？!?、,.\s]+$/u, '');
  if (/[a-zA-Z0-9０-９「」『』（）()]/.test(text)) return null;
  const tokens = [];
  let i = 0;
  let pendingKana = '';
  const flush = () => {
    if (pendingKana) tokens.push(pendingKana);
    pendingKana = '';
  };
  while (i < text.length) {
    if (text[i] === '、') {
      i++;
      continue;
    }
    let hit = null;
    for (let len = Math.min(maxLen, text.length - i); len > 0; len--) {
      const s = text.slice(i, i + len);
      if (lexicon.has(s) && (len > 1 || KANJI.test(s) || ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'か', 'ね', 'よ'].includes(s))) {
        hit = s;
        break;
      }
    }
    if (hit) {
      flush();
      const reading = lexicon.get(hit);
      tokens.push(KANJI.test(hit) ? `${hit}|${reading}` : hit);
      i += hit.length;
    } else if (KANA_ONLY.test(text[i])) {
      pendingKana += text[i++];
    } else {
      return null; // unknown kanji: we can't be sure of the reading
    }
  }
  flush();
  return tokens.length > 1 ? tokens : null;
}
