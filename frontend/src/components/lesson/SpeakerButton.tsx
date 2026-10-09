"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

import { speak, speechSupported } from "@/lib/speech";

interface SpeakerButtonProps {
  text: string;
  lang: string;
}

/**
 * Reads the prompt aloud. The button hides itself when the API is missing
 * rather than offering something that would silently do nothing.
 *
 * Support is resolved in an effect because the server render cannot know what
 * the device can do, and a button that appears only after hydration is better
 * than one that disappears.
 */
export function SpeakerButton({ text, lang }: SpeakerButtonProps) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(speechSupported());
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => speak(text, lang)}
      aria-label={`Listen to "${text}"`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-b-4 border-info bg-info text-white transition active:translate-y-[2px] active:border-b-2"
    >
      <Volume2 size={20} strokeWidth={3} aria-hidden />
    </button>
  );
}
