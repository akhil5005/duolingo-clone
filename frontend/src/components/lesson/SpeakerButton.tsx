"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

interface SpeakerButtonProps {
  text: string;
  lang: string;
}

/**
 * Reads the prompt aloud with the browser's own speech synthesis.
 *
 * No audio files are shipped, so pronunciation depends on the voices the
 * device happens to have. The button hides itself when the API is missing
 * rather than offering something that would silently do nothing.
 */
export function SpeakerButton({ text, lang }: SpeakerButtonProps) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  if (!supported) return null;

  const speak = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={`Listen to "${text}"`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-b-4 border-info bg-info text-white transition active:translate-y-[2px] active:border-b-2"
    >
      <Volume2 size={20} strokeWidth={3} aria-hidden />
    </button>
  );
}
