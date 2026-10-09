// Verb conjugation for the generator: dictionary form → polite ます form and て form.
// Classes follow JMdict part-of-speech tags: v1 (ichidan), v5* (godan), vs (suru), vk (kuru).

const GODAN = {
  う: ['い', 'って'], つ: ['ち', 'って'], る: ['り', 'って'],
  む: ['み', 'んで'], ぶ: ['び', 'んで'], ぬ: ['に', 'んで'],
  く: ['き', 'いて'], ぐ: ['ぎ', 'いで'], す: ['し', 'して'],
};

/** Map a JMdict pos entity (e.g. "v5k-s", "v1", "vs-i") to a conjugation class. */
export function classFromPos(pos = []) {
  for (const p of pos) {
    if (p === 'v1' || p === 'v1-s') return 'ichidan';
    if (p === 'v5k-s') return 'iku';
    if (p.startsWith('v5')) return 'godan';
    if (p === 'vs-i' || p === 'vs-s' || p === 'vs') return 'suru';
    if (p === 'vk') return 'kuru';
  }
  return null;
}

function stem(word, cls, form /* 0 = masu stem, 1 = te */) {
  const last = word.slice(-1);
  const base = word.slice(0, -1);
  switch (cls) {
    case 'ichidan':
      return base + (form ? 'て' : '');
    case 'godan':
    case 'iku': {
      if (cls === 'iku' && form) return base + 'って';
      const g = GODAN[last];
      if (!g) throw new Error(`not a godan verb: ${word}`);
      return base + g[form];
    }
    case 'suru':
      return word.slice(0, -2) + (form ? 'して' : 'し');
    case 'kuru': {
      // 来る / くる: the stem vowel changes (き), the kanji doesn't.
      const k = word.slice(0, -1);
      return (k === 'く' ? 'き' : k) + (form ? 'て' : '');
    }
    default:
      throw new Error(`unknown verb class ${cls} for ${word}`);
  }
}

/** { jp, kana } in ます form. */
export const masu = (jp, kana, cls) => ({ jp: stem(jp, cls, 0) + 'ます', kana: stem(kana, cls, 0) + 'ます' });
/** { jp, kana } in て form. */
export const te = (jp, kana, cls) => ({ jp: stem(jp, cls, 1), kana: stem(kana, cls, 1) });
