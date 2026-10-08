"use client";

import clsx from "clsx";

import { useNumberKeys } from "@/hooks/useKeyboard";
import type { MCOption } from "@/lib/types";

interface MultipleChoiceProps {
  payload: { question: string; options: MCOption[] };
  value: string | null;
  onChange: (optionId: string | null) => void;
  disabled: boolean;
}

export function MultipleChoice({ payload, value, onChange, disabled }: MultipleChoiceProps) {
  useNumberKeys(
    (index) => {
      const option = payload.options[index];
      if (option) onChange(option.id);
    },
    { enabled: !disabled, count: payload.options.length },
  );

  const hasArt = payload.options.some((option) => option.emoji);

  return (
    <div className={clsx("grid gap-3", hasArt ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
      {payload.options.map((option, index) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
            className={clsx(
              "relative flex items-center gap-3 rounded-2xl border-2 border-b-4 p-4 pb-9 text-left transition",
              hasArt && "flex-col items-center justify-center gap-2 text-center",
              selected
                ? "border-info bg-info/10 text-info"
                : "border-line bg-surface hover:bg-ink/5",
              disabled && "cursor-default",
            )}
          >
            {option.emoji && (
              <span className="text-4xl sm:text-5xl" aria-hidden>
                {option.emoji}
              </span>
            )}
            <span className="text-base">{option.text}</span>
            <span
              aria-hidden
              className={clsx(
                "absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-lg border-2 text-xs",
                selected ? "border-info text-info" : "border-line text-muted",
              )}
            >
              {index + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
