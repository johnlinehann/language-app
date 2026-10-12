import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
// @ts-expect-error plain JS helper shared with the content scripts
import { strokePaths } from '../scripts/lib/kanjivg.mjs';

const ID = 'virtual:strokes';

/**
 * `virtual:strokes` exports { [hexCodepoint]: string[] } of stroke paths (KanjiVG).
 * Empty in the normal build, where stroke SVGs are fetched from /kanjivg/ instead;
 * filled in the single-file build, where there's no server to fetch from.
 */
export function strokesPlugin({ inline }: { inline: boolean }): Plugin {
  return {
    name: 'kotoba-strokes',
    resolveId: (id) => (id === ID ? '\0' + ID : null),
    load(id) {
      if (id !== '\0' + ID) return null;
      const map: Record<string, string[]> = {};
      if (inline) {
        const dir = join(__dirname, '..', 'public', 'kanjivg');
        for (const f of readdirSync(dir).filter((n) => n.endsWith('.svg')))
          map[f.replace('.svg', '')] = strokePaths(readFileSync(join(dir, f), 'utf8'));
      }
      return `export default ${JSON.stringify(map)};`;
    },
  };
}
