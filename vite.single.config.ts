import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { strokesPlugin } from './vite/strokes-plugin';

// One self-contained dist-single/index.html: JS, CSS, stroke data and icon inlined.
// No service worker or manifest (neither works from file://).
const favicon = 'data:image/svg+xml;base64,' + readFileSync('public/favicon.svg').toString('base64');

export default defineConfig({
  publicDir: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@content': fileURLToPath(new URL('./content', import.meta.url)),
      'virtual:pwa-register': fileURLToPath(new URL('./src/lib/no-pwa.ts', import.meta.url)),
    },
  },
  define: { 'import.meta.env.VITE_SINGLE': '"1"' },
  build: { outDir: 'dist-single', emptyOutDir: true, assetsInlineLimit: Infinity, cssCodeSplit: false },
  plugins: [
    react(),
    strokesPlugin({ inline: true }),
    {
      name: 'kotoba-single-html',
      transformIndexHtml: (html) =>
        html.replace('href="/favicon.svg"', `href="${favicon}"`).replace(/\s*<link rel="apple-touch-icon"[^>]*>/, ''),
    },
    viteSingleFile(),
  ],
});
