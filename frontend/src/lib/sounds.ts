/**
 * Feedback tones generated with the Web Audio API.
 *
 * No audio files: nothing to license, nothing to download, and the tones can be
 * shaped in code. A rising two-note chime for a correct answer, a short low
 * buzz for a wrong one.
 */

type Tone = { frequency: number; start: number; duration: number };

const CORRECT: Tone[] = [
  { frequency: 587.33, start: 0, duration: 0.12 }, // D5
  { frequency: 880.0, start: 0.1, duration: 0.22 }, // A5
];

const WRONG: Tone[] = [{ frequency: 155.56, start: 0, duration: 0.28 }]; // E♭3

const COMPLETE: Tone[] = [
  { frequency: 523.25, start: 0, duration: 0.12 }, // C5
  { frequency: 659.25, start: 0.11, duration: 0.12 }, // E5
  { frequency: 783.99, start: 0.22, duration: 0.3 }, // G5
];

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  // Browsers suspend the context until a user gesture; a lesson always has one.
  if (context.state === "suspended") void context.resume();
  return context;
}

function play(tones: Tone[], type: OscillatorType, gain: number): void {
  const ctx = audioContext();
  if (!ctx) return;

  for (const tone of tones) {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    const at = ctx.currentTime + tone.start;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(tone.frequency, at);
    // Fade out instead of cutting off, which would click.
    envelope.gain.setValueAtTime(gain, at);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + tone.duration);

    oscillator.connect(envelope).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + tone.duration);
  }
}

export const sounds = {
  correct: () => play(CORRECT, "triangle", 0.12),
  wrong: () => play(WRONG, "square", 0.08),
  complete: () => play(COMPLETE, "triangle", 0.12),
};
