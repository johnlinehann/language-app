// JMdict (EDRDG, CC BY-SA 4.0) streaming parser. Works on the raw XML (JMdict_e).
import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';

export const JMDICT_URL = 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz';

const all = (block, tag) => [...block.matchAll(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'g'))].map((m) => m[1]);

/** Parse one <entry>…</entry> block. */
export function parseEntry(block) {
  const id = all(block, 'ent_seq')[0];
  const kanji = all(block, 'keb');
  const readings = all(block, 'reb');
  const senses = [...block.matchAll(/<sense>([\s\S]*?)<\/sense>/g)].map((m) => ({
    pos: all(m[1], 'pos').map((p) => p.replace(/^&|;$/g, '')),
    gloss: all(m[1], 'gloss'),
  }));
  // pos is inherited by following senses when omitted
  for (let i = 1; i < senses.length; i++) if (!senses[i].pos.length) senses[i].pos = senses[i - 1].pos;
  const common = /<(ke|re)_pri>(news1|ichi1|spec1|spec2|gai1)</.test(block);
  return { id, kanji, readings, senses, common };
}

/** Async iterator of entries from an iterable of lines. */
export async function* parseJmdictLines(lines) {
  let buf = null;
  for await (const line of lines) {
    if (line.includes('<entry>')) buf = [];
    if (buf) buf.push(line);
    if (line.includes('</entry>') && buf) {
      yield parseEntry(buf.join('\n'));
      buf = null;
    }
  }
}

export function readLines(file) {
  const stream = file.endsWith('.gz') ? createReadStream(file).pipe(createGunzip()) : createReadStream(file);
  return createInterface({ input: stream, crlfDelay: Infinity });
}

/**
 * Index entries by written form and by reading. Only keeps what the generator needs.
 * Returns { byForm: Map<form, entry[]>, size }.
 */
export async function loadJmdict(lines) {
  const byForm = new Map();
  let size = 0;
  for await (const e of parseJmdictLines(lines)) {
    size++;
    for (const f of new Set([...e.kanji, ...e.readings])) {
      if (!byForm.has(f)) byForm.set(f, []);
      byForm.get(f).push(e);
    }
  }
  return { byForm, size };
}

/** Best entry for a word: matching written form and reading, common entries first. */
export function lookup(dict, jp, kana) {
  const cands = dict.byForm.get(jp) ?? [];
  const match = cands.filter((e) => (e.kanji.length ? e.kanji.includes(jp) : true) && e.readings.includes(kana));
  return (match.length ? match : cands).sort((a, b) => Number(b.common) - Number(a.common))[0] ?? null;
}
