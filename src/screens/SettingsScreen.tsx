import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/state/settings';
import { loadVoices, speak, ttsSupported } from '@/audio/tts';
import { downloadJson, exportProgress, importProgress, resetProgress } from '@/db/backup';
import { localDay } from '@/lib/date';
import { IconInfo, IconSpeaker } from '@/components/Icons';
import type { Settings } from '@/types';

export default function SettingsScreen() {
  const { settings, update } = useSettings();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void loadVoices().then(setVoices);
  }, []);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      await importProgress(JSON.parse(await file.text()));
      setMsg('Progress imported.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Import failed.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-6">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <Group title="Display">
        <Toggle label="Show romaji" hint="Latin spelling under Japanese text" checked={settings.romaji} onChange={(v) => update({ romaji: v })} />
        <Toggle label="Show furigana" hint="Kana readings above kanji" checked={settings.furigana} onChange={(v) => update({ furigana: v })} />
        <Row label="Theme">
          <Segmented
            name="theme"
            value={settings.dark}
            options={[
              ['system', 'Auto'],
              ['light', 'Light'],
              ['dark', 'Dark'],
            ]}
            onChange={(v) => update({ dark: v as Settings['dark'] })}
          />
        </Row>
      </Group>

      <Group title="Audio">
        <Toggle label="Sound effects" checked={settings.sound} onChange={(v) => update({ sound: v })} />
        {ttsSupported() ? (
          <>
            <Row label="Speech speed" htmlFor="rate">
              <span className="flex items-center gap-2">
                <input
                  id="rate"
                  type="range"
                  min={0.5}
                  max={1.3}
                  step={0.1}
                  value={settings.ttsRate}
                  onChange={(e) => update({ ttsRate: Number(e.target.value) })}
                  className="w-32 accent-ai-500"
                />
                <span className="w-10 text-right text-sm tabular-nums">{settings.ttsRate.toFixed(1)}×</span>
              </span>
            </Row>
            <Row label="Voice" htmlFor="voice">
              <span className="flex items-center gap-2">
                <select
                  id="voice"
                  value={settings.voiceURI ?? ''}
                  onChange={(e) => update({ voiceURI: e.target.value || null })}
                  className="max-w-[11rem] rounded-xl border-2 border-washi-200 bg-white px-2 py-2 text-sm dark:border-sumi-700 dark:bg-sumi-800"
                >
                  <option value="">Automatic</option>
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => speak('こんにちは、ことばへようこそ')} aria-label="Test voice" className="grid h-11 w-11 place-items-center rounded-xl bg-ai-500 text-white">
                  <IconSpeaker className="h-5 w-5" />
                </button>
              </span>
            </Row>
            {voices.length === 0 && (
              <p className="px-4 pb-3 text-sm opacity-70">
                No Japanese voice found. Add one in your device's text-to-speech settings (e.g. Android: Google TTS → Japanese; iOS: Spoken Content → Voices).
              </p>
            )}
          </>
        ) : (
          <p className="px-4 py-3 text-sm opacity-70">This browser doesn't support speech synthesis.</p>
        )}
      </Group>

      <Group title="Challenge">
        <Toggle
          label="Hearts"
          hint="Lose a heart per mistake in lessons; refill over time or with Practice"
          checked={settings.hearts}
          onChange={(v) => update({ hearts: v })}
        />
      </Group>

      <Group title="Your data">
        <p className="px-4 pt-3 text-sm opacity-70">Everything stays on this device. Export a backup to move progress to another phone.</p>
        <div className="flex flex-wrap gap-3 p-4">
          <button type="button" className="btn-ghost flex-1" onClick={async () => downloadJson(await exportProgress(), `kotoba-progress-${localDay()}.json`)}>
            Export
          </button>
          <label className="btn-ghost flex-1 cursor-pointer">
            Import
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void onImport(e.target.files?.[0])} />
          </label>
        </div>
        {msg && (
          <p role="status" className="px-4 pb-3 text-sm font-bold text-ai-500">
            {msg}
          </p>
        )}
        <div className="border-t-2 border-washi-200 p-4 dark:border-sumi-700">
          {confirmReset ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold">Erase all progress on this device? This can't be undone.</p>
              <div className="flex gap-3">
                <button type="button" className="btn-ghost flex-1" onClick={() => setConfirmReset(false)} autoFocus>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger flex-1"
                  onClick={async () => {
                    await resetProgress();
                    setConfirmReset(false);
                    setMsg('Progress reset.');
                  }}
                >
                  Erase
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="text-sm font-bold text-rose-500" onClick={() => setConfirmReset(true)}>
              Reset progress…
            </button>
          )}
        </div>
      </Group>

      <Link to="/about" className="card mt-5 flex items-center gap-3 p-4">
        <IconInfo className="h-6 w-6 text-ai-500" />
        <span className="flex-1 font-bold">About Kotoba & data sources</span>
        <span aria-hidden>›</span>
      </Link>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `g-${title.replace(/\s/g, '')}`;
  return (
    <section aria-labelledby={id} className="mt-6">
      <h2 id={id} className="mb-2 text-sm font-extrabold uppercase tracking-wider opacity-60">
        {title}
      </h2>
      <div className="card divide-y-2 divide-washi-200 dark:divide-sumi-700">{children}</div>
    </section>
  );
}

function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-3 px-4 py-2">
      <label htmlFor={htmlFor} className="font-bold">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-[60px] w-full items-center justify-between gap-3 px-4 py-2 text-left">
      <span>
        <span className="block font-bold">{label}</span>
        {hint && <span className="block text-sm opacity-60">{hint}</span>}
      </span>
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? 'bg-matcha-500' : 'bg-washi-200 dark:bg-sumi-700'}`} aria-hidden>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </span>
    </button>
  );
}

function Segmented({ name, value, options, onChange }: { name: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex rounded-xl bg-washi-100 p-1 dark:bg-sumi-900">
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`min-h-[40px] rounded-lg px-3 text-sm font-bold ${value === v ? 'bg-white shadow dark:bg-sumi-700' : 'opacity-60'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
