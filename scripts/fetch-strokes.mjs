#!/usr/bin/env node
// Downloads KanjiVG stroke-order SVGs for every character listed in an item's
// `strokes` field across content/**.json, into public/kanjivg/.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchKanjiVG } from './lib/kanjivg.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function* jsonFiles(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* jsonFiles(p);
    else if (f.endsWith('.json')) yield p;
  }
}

const chars = [];
for (const file of jsonFiles(join(ROOT, 'content'))) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  for (const unit of [data].flat())
    for (const lesson of unit.lessons) for (const it of lesson.items) chars.push(...(it.strokes ?? []));
}
const missing = await fetchKanjiVG(chars, join(ROOT, 'public', 'kanjivg'));
console.log(`stroke SVGs: ${new Set(chars).size - missing.length} ok, ${missing.length} missing ${missing.join('')}`);
