/**
 * Browser speech synthesis, shared by the prompt speaker button and by the
 * tiles the learner taps.
 *
 * No audio files are shipped, so pronunciation depends on the voices the
 * device happens to have. Callers are expected to hide or skip their audio
 * affordance when `speechSupported()` is false rather than offering something
 * that would silently do nothing.
 */

/**
 * Voice locales for the languages this app teaches.
 *
 * Synthesis wants a region ("es-ES"), while course rows store a bare ISO code
 * ("es"). Anything already carrying a region, and anything unlisted, is passed
 * through untouched so a new course needs no change here to make a sound.
 */
const VOICE_LOCALES: Record<string, string> = {
  es: "es-ES",
  fr: "fr-FR",
  en: "en-US",
};

export function voiceLocale(languageCode: string): string {
  if (languageCode.includes("-")) return languageCode;
  return VOICE_LOCALES[languageCode] ?? languageCode;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Say one word or sentence, cutting off whatever was already being said.
 *
 * Tiles are tapped faster than they can be spoken, so the cancel matters: it
 * keeps the audio on the tile the learner touched last instead of queueing a
 * backlog that plays long after they have moved on.
 */
export function speak(text: string, languageCode: string, rate = 0.9): void {
  if (!speechSupported() || !text.trim()) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voiceLocale(languageCode);
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}
