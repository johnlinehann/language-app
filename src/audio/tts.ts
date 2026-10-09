/** Text-to-speech via the browser's built-in Web Speech API (free, offline on most phones). */

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

export const ttsSupported = () => !!synth;

export function japaneseVoices(): SpeechSynthesisVoice[] {
  if (!synth) return [];
  return synth.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja'));
}

/** Resolves once voices are loaded (Chrome loads them asynchronously). */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!synth) return resolve([]);
    const now = japaneseVoices();
    if (now.length) return resolve(now);
    const done = () => resolve(japaneseVoices());
    synth.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}

let prefs = { rate: 0.9, voiceURI: null as string | null };
export function configureTts(rate: number, voiceURI: string | null) {
  prefs = { rate, voiceURI };
}

export function speak(text: string, opts: { slow?: boolean } = {}) {
  if (!synth || !text) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  const voices = japaneseVoices();
  const voice = voices.find((v) => v.voiceURI === prefs.voiceURI) ?? voices.find((v) => v.localService) ?? voices[0];
  if (voice) u.voice = voice;
  u.rate = prefs.rate * (opts.slow ? 0.6 : 1);
  synth.speak(u);
}
