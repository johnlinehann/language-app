import { Link } from 'react-router-dom';
import { Mascot } from '@/components/Mascot';

const SOURCES = [
  {
    name: 'JMdict',
    what: 'Japanese–English dictionary (meanings, readings)',
    by: 'Electronic Dictionary Research and Development Group (EDRDG)',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: 'https://www.edrdg.org/jmdict/j_jmdict.html',
  },
  {
    name: 'KANJIDIC2',
    what: 'Kanji information (readings, meanings, JLPT level, stroke counts)',
    by: 'Electronic Dictionary Research and Development Group (EDRDG)',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: 'https://www.edrdg.org/wiki/index.php/KANJIDIC_Project',
  },
  {
    name: 'KanjiVG',
    what: 'Stroke-order diagrams for kana and kanji',
    by: 'Ulrich Apel and contributors',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    url: 'https://kanjivg.tagaini.net',
  },
  {
    name: 'Tatoeba',
    what: 'Example sentences and translations',
    by: 'Tatoeba contributors',
    license: 'CC BY 2.0 FR',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/fr/',
    url: 'https://tatoeba.org',
  },
];

export default function AboutScreen() {
  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-6">
      <Link to="/settings" className="text-sm font-bold text-ai-500">‹ Settings</Link>
      <div className="mt-4 flex items-center gap-4">
        <Mascot size={80} />
        <div>
          <h1 className="text-2xl font-extrabold">Kotoba 言葉</h1>
          <p className="opacity-70">Free Japanese lessons. No ads, no accounts, no tracking.</p>
        </div>
      </div>

      <section className="card mt-6 p-4">
        <h2 className="font-extrabold">Privacy</h2>
        <p className="mt-1 text-sm">
          Kotoba has no server. Your progress lives in this browser's storage (IndexedDB) and never leaves your device unless you export it. Speech uses your
          device's built-in voices. Works offline once installed.
        </p>
      </section>

      <section className="mt-6" aria-labelledby="src-h">
        <h2 id="src-h" className="mb-2 font-extrabold">Data sources & attribution</h2>
        <p className="mb-3 text-sm opacity-70">
          Course content is hand-written and generated with the help of these openly licensed projects. Content derived from them is shared under the same
          licenses.
        </p>
        <ul className="flex flex-col gap-3">
          {SOURCES.map((s) => (
            <li key={s.name} className="card p-4">
              <p className="font-extrabold">
                <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-ai-400 underline-offset-2">
                  {s.name}
                </a>
              </p>
              <p className="text-sm">{s.what}</p>
              <p className="mt-1 text-xs opacity-70">
                © {s.by} ·{' '}
                <a href={s.licenseUrl} target="_blank" rel="noreferrer" className="underline">
                  {s.license}
                </a>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-6 p-4 text-sm">
        <h2 className="font-extrabold">Open source</h2>
        <p className="mt-1">
          Spaced repetition uses the FSRS algorithm (open-spaced-repetition, MIT). Romaji→kana conversion by WanaKana (MIT). App code is MIT licensed.
        </p>
      </section>
    </div>
  );
}
