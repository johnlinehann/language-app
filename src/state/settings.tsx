import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, setMeta } from '@/db/db';
import { DEFAULT_SETTINGS, type Settings } from '@/types';
import { configureTts } from '@/audio/tts';
import { setSfxEnabled } from '@/audio/sfx';

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => Promise<void>;
}

const SettingsContext = createContext<Ctx>({ settings: DEFAULT_SETTINGS, update: async () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const row = useLiveQuery(() => db.meta.get('settings'), []);
  const settings: Settings = { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };

  useEffect(() => {
    configureTts(settings.ttsRate, settings.voiceURI);
    setSfxEnabled(settings.sound);
  }, [settings.ttsRate, settings.voiceURI, settings.sound]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.dark === 'dark' || (settings.dark === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121218' : '#fffaf3');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.dark]);

  const update = async (patch: Partial<Settings>) => {
    const current = ((await db.meta.get('settings'))?.value as Partial<Settings>) ?? {};
    await setMeta('settings', { ...current, ...patch });
  };

  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
