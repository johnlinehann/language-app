#!/usr/bin/env node
/**
 * Kotoba content pipeline.
 *
 *   npm run content:build              # download sources (cached in scripts/.cache), build, fetch strokes
 *   npm run content:build -- --offline # seeds only, no downloads
 *
 * Inputs:  scripts/topics.mjs (curated seeds), content/*.json (hand-authored units)
 * Sources: JMdict, KANJIDIC2 (EDRDG, CC BY-SA 4.0), Tatoeba (CC BY 2.0 FR), KanjiVG (CC BY-SA 3.0)
 * Output:  content/generated/*.json, public/kanjivg/*.svg
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toRomaji } from 'wanakana';
import { TOPICS, VERBS, verb } from './topics.mjs';
import { masu, te, classFromPos } from './lib/conjugate.mjs';
import { download } from './lib/download.mjs';
import { JMDICT_URL, loadJmdict, lookup, readLines } from './lib/jmdict.mjs';
import { KANJIDIC_URL, loadKanjidic, isBeginnerKanji } from './lib/kanjidic.mjs';
import { TATOEBA, loadPairs, loadSentences, segment } from './lib/tatoeba.mjs';
import { fetchKanjiVG } from './lib/kanjivg.mjs';
import { validateUnits } from './lib/validate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'scripts', '.cache');
const OUT = join(ROOT, 'content', 'generated');
const args = new Set(process.argv.slice(2));
const OFFLINE = args.has('--offline');
const log = (...a) => console.log('·', ...a);
const warn = (...a) => console.warn('⚠', ...a);

const KANJI = /[㐀-鿿々]/;
const PARTICLE_ROMAJI = { は: 'wa', へ: 'e', を: 'o' };
const split = (en) => en.split(';').map((s) => s.trim());

export function romajiOf(kana) {
  return toRomaji(kana).replace(/n'/g, "n'");
}

export function tokenParts(token) {
  const [text, reading = text] = token.split('|');
  return { text: text.replace(/[、。]/g, ''), reading: reading.replace(/[、。]/g, '') };
}

export function sentenceRomaji(tokens) {
  return tokens.map((t) => PARTICLE_ROMAJI[tokenParts(t).text] ?? romajiOf(tokenParts(t).reading)).join(' ');
}

/* ---------------- sources ---------------- */

async function cached(url, name) {
  const file = join(CACHE, name);
  await download(url, file);
  return file;
}

function bunzip(file) {
  const out = file.replace(/\.bz2$/, '');
  if (!existsSync(out)) execFileSync('bunzip2', ['-k', '-f', file]);
  return out;
}

async function loadSources() {
  const src = { jmdict: null, kanjidic: null, pairs: null };
  if (OFFLINE) return src;
  mkdirSync(CACHE, { recursive: true });
  try {
    log('JMdict: loading…');
    src.jmdict = await loadJmdict(readLines(await cached(JMDICT_URL, 'JMdict_e.gz')));
    log(`JMdict: ${src.jmdict.size} entries`);
  } catch (e) {
    warn(`JMdict unavailable (${e.message}); using seed glosses`);
  }
  try {
    log('KANJIDIC2: loading…');
    src.kanjidic = await loadKanjidic(readLines(await cached(KANJIDIC_URL, 'kanjidic2.xml.gz')));
    log(`KANJIDIC2: ${src.kanjidic.size} kanji`);
  } catch (e) {
    warn(`KANJIDIC2 unavailable (${e.message}); every kanji gets stroke order`);
  }
  if (!args.has('--no-tatoeba')) {
    try {
      log('Tatoeba: loading…');
      const short = (t) => t.length <= 14;
      const jpn = await loadSentences(readLines(bunzip(await cached(TATOEBA.jpn, 'jpn_sentences.tsv.bz2'))), short);
      const eng = await loadSentences(readLines(bunzip(await cached(TATOEBA.eng, 'eng_sentences.tsv.bz2'))), (t) => t.length <= 40);
      src.pairs = await loadPairs(readLines(bunzip(await cached(TATOEBA.links, 'jpn-eng_links.tsv.bz2'))), jpn, eng);
      log(`Tatoeba: ${src.pairs.length} short jpn–eng pairs`);
    } catch (e) {
      warn(`Tatoeba unavailable (${e.message}); using seed sentences only`);
    }
  }
  return src;
}

/* ---------------- item builders ---------------- */

function existingContent() {
  const units = [];
  for (const f of readdirSync(join(ROOT, 'content'))) if (f.endsWith('.json')) units.push(...[JSON.parse(readFileSync(join(ROOT, 'content', f), 'utf8'))].flat());
  return units;
}

export function createBuilder(src, existing) {
  const ids = new Set(existing.flatMap((u) => u.lessons.flatMap((l) => l.items.map((i) => i.id))));
  const strokesSeen = new Set(existing.flatMap((u) => u.lessons.flatMap((l) => l.items.flatMap((i) => i.strokes ?? []))));
  const report = { jmdictHits: 0, jmdictMisses: [], classMismatch: [], tatoeba: 0 };

  const uniqueId = (base) => {
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}${n}`;
    ids.add(id);
    return id;
  };

  const strokesFor = (jp) => {
    const out = [];
    for (const ch of jp) {
      if (!KANJI.test(ch) || strokesSeen.has(ch) || out.length >= 2) continue;
      if (src.kanjidic && !isBeginnerKanji(src.kanjidic.get(ch))) continue;
      strokesSeen.add(ch);
      out.push(ch);
    }
    return out.length ? { strokes: out } : {};
  };

  const enrich = (jp, kana, en) => {
    if (!src.jmdict) return { en };
    const e = lookup(src.jmdict, jp, kana);
    if (!e) {
      report.jmdictMisses.push(jp);
      return { en };
    }
    report.jmdictHits++;
    const have = new Set(en.map((x) => x.toLowerCase()));
    const extra = (e.senses[0]?.gloss ?? []).filter((g) => g.length <= 24 && !/[()]/.test(g) && !have.has(g.toLowerCase()));
    return { en: [...en, ...extra].slice(0, Math.max(en.length, 4)), source: `jmdict:${e.id}`, entry: e };
  };

  const word = (w) => {
    const romaji = romajiOf(w.kana);
    const { en, source } = enrich(w.jp, w.kana, split(w.en));
    const single = [...w.jp].length === 1 && KANJI.test(w.jp);
    return {
      id: uniqueId(`g.${romaji.replace(/[^a-z]/g, '')}`),
      jp: w.jp,
      kana: w.kana,
      romaji,
      en,
      audioText: w.kana,
      type: single ? 'kanji' : 'word',
      ...(w.emoji ? { emoji: w.emoji } : {}),
      ...strokesFor(w.jp),
      ...(source ? { source } : {}),
    };
  };

  const checkVerbClass = (v) => {
    if (!src.jmdict) return;
    const e = lookup(src.jmdict, v.jp, v.kana);
    const cls = e && classFromPos(e.senses[0]?.pos);
    if (cls && cls !== v.cls && !(cls === 'godan' && v.cls === 'iku')) report.classMismatch.push(`${v.jp}: seed ${v.cls}, JMdict ${cls}`);
  };

  const verbForm = (v, form) => {
    checkVerbClass(v);
    const f = form === 'masu' ? masu(v.jp, v.kana, v.cls) : te(v.jp, v.kana, v.cls);
    const base = split(v.en);
    const { source } = enrich(v.jp, v.kana, base);
    const romaji = romajiOf(f.kana);
    return {
      id: uniqueId(`g.${romaji}`),
      jp: f.jp,
      kana: f.kana,
      romaji,
      en: form === 'masu' ? base : base.map((e) => `${e} (te-form)`),
      audioText: f.kana,
      type: 'word',
      ...(v.emoji ? { emoji: v.emoji } : {}),
      ...strokesFor(v.jp),
      note: `Dictionary form: ${v.jp}（${v.kana}）`,
      ...(source ? { source } : {}),
    };
  };

  const particle = (p) => ({
    id: uniqueId(`p.${p.romaji}`),
    jp: p.jp,
    kana: p.kana,
    romaji: p.romaji,
    en: split(p.en),
    audioText: p.audio ?? p.jp,
    type: 'word',
    note: `Particle: comes after the word it marks.`,
  });

  const sentence = (s, source) => {
    const parts = s.tokens.map(tokenParts);
    const romaji = sentenceRomaji(s.tokens);
    const jp = parts.map((p) => p.text).join('');
    return {
      id: uniqueId(`gs.${romaji.replace(/[^a-z]/g, '').slice(0, 32)}`),
      jp,
      kana: parts.map((p) => p.reading).join(''),
      romaji,
      en: Array.isArray(s.en) ? s.en : split(s.en),
      audioText: jp,
      type: 'sentence',
      tokens: s.tokens.map((t) => {
        const { text, reading } = tokenParts(t);
        return text === reading ? text : `${text}|${reading}`;
      }),
      ...(source ? { source } : {}),
    };
  };

  const build = (seed) => {
    switch (seed.kind) {
      case 'word':
        return word(seed);
      case 'particle':
        return particle(seed);
      case 'sentence':
        return sentence(seed);
      default:
        throw new Error(`unknown seed kind ${seed.kind}`);
    }
  };

  return { build, verbForm, sentence, report, ids };
}

/** Readings we trust for segmentation: course vocabulary first, then unambiguous common JMdict words. */
function buildLexicon(units, jmdict) {
  const lex = new Map();
  const add = (form, reading) => form && reading && !lex.has(form) && lex.set(form, reading);
  for (const u of units)
    for (const l of u.lessons)
      for (const it of l.items) {
        if (it.type !== 'sentence') add(it.jp, it.kana);
        for (const t of it.tokens ?? []) add(...t.split('|').concat(t).slice(0, 2));
      }
  if (jmdict)
    for (const [form, entries] of jmdict.byForm) {
      if (!KANJI.test(form) || entries.length !== 1) continue;
      const e = entries[0];
      if (e.common && e.readings.length === 1) add(form, e.readings[0]);
    }
  return lex;
}

function addTatoeba(units, pairs, lexicon, b) {
  if (!pairs) return;
  const used = new Set(units.flatMap((u) => u.lessons.flatMap((l) => l.items.map((i) => i.jp))));
  for (const u of units)
    for (const l of u.lessons) {
      if (l.items.length >= 7) continue;
      const keys = l.items.filter((i) => i.type !== 'sentence' && (i.jp.length > 1 || KANJI.test(i.jp))).map((i) => i.jp);
      const hit = pairs.find((p) => !used.has(p.jp) && keys.some((k) => p.jp.includes(k)) && p.en.split(' ').length <= 7 && segment(p.jp, lexicon));
      if (!hit) continue;
      used.add(hit.jp);
      const tokens = segment(hit.jp, lexicon);
      l.items.push(b.sentence({ tokens, en: [hit.en.replace(/[.!?]$/, '')] }, `tatoeba:${hit.id}`));
      b.report.tatoeba++;
    }
}

/* ---------------- main ---------------- */

export function buildUnits(topics, b) {
  return topics.map((t) => ({
    unit: t.unit,
    title: t.title,
    level: t.level,
    description: t.description,
    checkpoint: true,
    lessons: t.lessons.map((l, i) => {
      let items;
      if (l.verbs) items = l.verbs.map((jp) => b.verbForm(verb(jp), 'masu'));
      else if (l.teVerbs) items = l.teVerbs.map((jp) => b.verbForm(verb(jp), 'te'));
      else items = l.items.map(b.build);
      if (l.note && items[0]) items[0].note = l.note;
      return { lesson: `${t.unit}-l${i + 1}`, title: l.title, items };
    }),
  }));
}

async function main() {
  const existing = existingContent();
  const src = await loadSources();
  const b = createBuilder(src, existing);
  const units = buildUnits(TOPICS, b);
  addTatoeba(units, src.pairs, buildLexicon([...existing, ...units], src.jmdict?.byForm ? src.jmdict : null), b);

  const { errors, warnings } = validateUnits([...existing, ...units]);
  for (const w of warnings) warn(w);
  if (errors.length) {
    for (const e of errors) console.error('✗', e);
    process.exit(1);
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  for (const u of units) {
    const slug = toRomaji(u.title).toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
    writeFileSync(join(OUT, `${u.unit}-${slug}.json`), JSON.stringify(u, null, 2) + '\n');
  }
  writeFileSync(
    join(OUT, 'README.md'),
    `# Generated content\n\nWritten by \`npm run content:build\` — do not edit by hand; change \`scripts/topics.mjs\` instead.\n\n` +
      `Glosses: JMdict (EDRDG, CC BY-SA 4.0). Kanji data: KANJIDIC2 (EDRDG, CC BY-SA 4.0). ` +
      `Example sentences marked \`source: "tatoeba:<id>"\`: Tatoeba (CC BY 2.0 FR). Stroke order: KanjiVG (CC BY-SA 3.0).\n`,
  );

  const items = units.reduce((a, u) => a + u.lessons.reduce((x, l) => x + l.items.length, 0), 0);
  log(`wrote ${units.length} units, ${items} items to content/generated/ (${OFFLINE ? 'offline' : 'online'})`);
  if (src.jmdict) log(`JMdict matched ${b.report.jmdictHits}; missing: ${b.report.jmdictMisses.join(' ') || 'none'}`);
  if (b.report.classMismatch.length) warn('verb class mismatches:', b.report.classMismatch.join('; '));
  if (src.pairs) log(`added ${b.report.tatoeba} Tatoeba sentences`);

  if (!args.has('--no-strokes')) {
    const chars = units.flatMap((u) => u.lessons.flatMap((l) => l.items.flatMap((i) => i.strokes ?? [])));
    const missing = await fetchKanjiVG(chars, join(ROOT, 'public', 'kanjivg'));
    log(`stroke SVGs: ${chars.length - missing.length} ok${missing.length ? `, missing ${missing.join('')}` : ''}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
