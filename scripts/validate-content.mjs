#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateUnits } from './lib/validate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function* jsonFiles(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* jsonFiles(p);
    else if (f.endsWith('.json')) yield p;
  }
}

const units = [];
for (const file of jsonFiles(join(ROOT, 'content'))) {
  try {
    units.push(...[JSON.parse(readFileSync(file, 'utf8'))].flat());
  } catch (e) {
    console.error(`✗ ${relative(ROOT, file)}: ${e.message}`);
    process.exit(1);
  }
}
const { errors, warnings } = validateUnits(units, { kanjivgDir: join(ROOT, 'public', 'kanjivg') });
for (const w of warnings) console.warn('⚠', w);
for (const e of errors) console.error('✗', e);
const items = units.reduce((a, u) => a + u.lessons.reduce((b, l) => b + l.items.length, 0), 0);
console.log(`${units.length} units, ${units.reduce((a, u) => a + u.lessons.length, 0)} lessons, ${items} items — ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
