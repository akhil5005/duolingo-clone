"use client";

import { useEffect, useRef } from "react";

interface TypeAnswerProps {
  payload: { source_text: string; target_lang: string };
  value: string;
  onChange: (text: string) => void;
  disabled: boolean;
}

export function TypeAnswer({ payload, value, onChange, disabled }: TypeAnswerProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled, payload.source_text]);

  return (
    <div className="space-y-5">
      <p className="rounded-2xl border-2 border-line bg-raised px-4 py-3 text-xl">
        {payload.source_text}
      </p>
      <textarea
        ref={inputRef}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        lang={payload.target_lang}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="sentences"
        aria-label="Type your answer"
        placeholder="Type in Spanish…"
        className="w-full resize-none rounded-2xl border-2 border-line bg-surface p-4 text-lg text-ink outline-none placeholder:text-muted/60 focus:border-info"
      />
    </div>
  );
}
