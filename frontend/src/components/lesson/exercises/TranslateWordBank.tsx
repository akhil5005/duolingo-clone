"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useState } from "react";

import { useKeyPress, useNumberKeys } from "@/hooks/useKeyboard";
import { speak } from "@/lib/speech";

interface TranslateWordBankProps {
  payload: { tokens: string[] };
  onChange: (tokens: string[] | null) => void;
  disabled: boolean;
  /**
   * The tokens' language, or null when they are English and should not be
   * spoken - a learner translating *into* English gains nothing from hearing
   * their own language read back a word at a time.
   */
  lang: string | null;
}

const TILE =
  "rounded-xl border-2 border-b-4 border-line bg-surface px-3 py-2 text-base transition";

/**
 * Tap-the-words.
 *
 * Picked tiles are tracked by index, not by text, so a sentence may repeat a
 * word ("the man and the woman") without the two tiles becoming
 * indistinguishable. The component is remounted per exercise, which is what
 * clears the selection between questions.
 */
export function TranslateWordBank({ payload, onChange, disabled, lang }: TranslateWordBankProps) {
  const [picked, setPicked] = useState<number[]>([]);

  const commit = (next: number[]) => {
    setPicked(next);
    onChange(next.length ? next.map((index) => payload.tokens[index] ?? "") : null);
  };

  const pick = (index: number) => {
    if (disabled || picked.includes(index)) return;
    commit([...picked, index]);
    const token = payload.tokens[index];
    if (lang && token) speak(token, lang);
  };

  const drop = (index: number) => {
    if (disabled) return;
    commit(picked.filter((taken) => taken !== index));
  };

  useNumberKeys(
    (position) => {
      const available = payload.tokens
        .map((_, index) => index)
        .filter((index) => !picked.includes(index));
      const index = available[position];
      if (index !== undefined) pick(index);
    },
    { enabled: !disabled, count: payload.tokens.length },
  );

  useKeyPress(
    "Backspace",
    () => {
      const last = picked[picked.length - 1];
      if (last !== undefined) drop(last);
    },
    { enabled: !disabled },
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2" aria-label="Your answer">
        {[0, 1].map((line) => (
          <div
            key={line}
            className="flex min-h-[52px] flex-wrap items-center gap-2 border-b-2 border-line pb-2"
          >
            {picked
              .filter((_, position) => (line === 0 ? position < 5 : position >= 5))
              .map((index) => (
                <motion.button
                  key={index}
                  layoutId={`token-${index}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => drop(index)}
                  lang={lang ?? undefined}
                  className={TILE}
                >
                  {payload.tokens[index]}
                </motion.button>
              ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2" aria-label="Word bank">
        {payload.tokens.map((token, index) =>
          picked.includes(index) ? (
            // An empty slot keeps the bank from reflowing as tiles are used.
            <span
              key={index}
              aria-hidden
              className="rounded-xl border-2 border-dashed border-line px-3 py-2 text-base text-transparent"
            >
              {token}
            </span>
          ) : (
            <motion.button
              key={index}
              layoutId={`token-${index}`}
              type="button"
              disabled={disabled}
              onClick={() => pick(index)}
              lang={lang ?? undefined}
              className={clsx(TILE, "hover:bg-ink/5")}
            >
              {token}
            </motion.button>
          ),
        )}
      </div>
    </div>
  );
}
