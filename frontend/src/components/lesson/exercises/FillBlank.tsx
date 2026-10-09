"use client";

import clsx from "clsx";

import { useNumberKeys } from "@/hooks/useKeyboard";
import { speak } from "@/lib/speech";

interface FillBlankProps {
  payload: { before: string; after: string; options: string[]; translation: string };
  value: string | null;
  onChange: (choice: string | null) => void;
  disabled: boolean;
  /** The sentence's language; a chosen word is read aloud in it. */
  lang: string;
}

/** Keeps the empty gap as tall as a line of text, so the dashed rule sits on the baseline. */
const GAP_SPACER = " ";

export function FillBlank({ payload, value, onChange, disabled, lang }: FillBlankProps) {
  /** Tapping the chosen word again clears it, and silence is the right sound for that. */
  const choose = (option: string) => {
    if (value === option) {
      onChange(null);
      return;
    }
    onChange(option);
    speak([payload.before, option, payload.after].join(" "), lang);
  };

  useNumberKeys(
    (index) => {
      const option = payload.options[index];
      if (option) choose(option);
    },
    { enabled: !disabled, count: payload.options.length },
  );

  return (
    <div className="space-y-6">
      <p lang={lang} className="flex flex-wrap items-center justify-center gap-2 text-2xl">
        <span>{payload.before}</span>
        <span
          className={clsx(
            "inline-flex min-w-[140px] items-center justify-center rounded-xl border-b-4 px-3 py-1",
            value ? "border-info bg-info/10 text-info" : "border-dashed border-line",
          )}
        >
          {value ?? GAP_SPACER}
        </span>
        <span>{payload.after}</span>
      </p>

      <p className="text-center text-sm font-semibold text-muted">{payload.translation}</p>

      <div className="flex flex-wrap justify-center gap-3">
        {payload.options.map((option, index) => (
          <button
            key={option}
            type="button"
            lang={lang}
            disabled={disabled}
            aria-pressed={value === option}
            onClick={() => choose(option)}
            className={clsx(
              "relative rounded-2xl border-2 border-b-4 px-5 py-3 pb-7 text-base transition",
              value === option
                ? "border-info bg-info/10 text-info"
                : "border-line bg-surface hover:bg-ink/5",
            )}
          >
            {option}
            <span
              aria-hidden
              className={clsx(
                "absolute bottom-1 right-2 text-xs",
                value === option ? "text-info" : "text-muted",
              )}
            >
              {index + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
