// Download helper: tries fetch(), falls back to curl (which honours HTTPS_PROXY).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export async function download(url, dest, { force = false } = {}) {
  if (!force && existsSync(dest)) return dest;
  mkdirSync(dirname(dest), { recursive: true });
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  } catch (err) {
    try {
      execFileSync('curl', ['-fsSL', '--retry', '2', '-o', dest, url], { stdio: 'pipe' });
    } catch {
      throw new Error(`Could not download ${url}: ${err.message}`);
    }
  }
  return dest;
}
