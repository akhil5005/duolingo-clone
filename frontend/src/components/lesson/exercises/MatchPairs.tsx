"use client";

import clsx from "clsx";
import { useState } from "react";

import type { MatchedPair } from "@/lib/types";

interface MatchPairsProps {
  payload: { left: string[]; right: string[] };
  value: MatchedPair[];
  onChange: (pairs: MatchedPair[]) => void;
  disabled: boolean;
}

const PAIR_COLORS = [
  "border-info bg-info/10 text-info",
  "border-brand bg-brand/10 text-brand-dark",
  "border-grape bg-grape/10 text-grape-dark",
  "border-flame bg-flame/10 text-flame-dark",
  "border-gold bg-gold/10 text-gold-dark",
  "border-danger bg-danger/10 text-danger",
];

const TILE =
  "w-full rounded-2xl border-2 border-b-4 px-3 py-4 text-sm transition active:translate-y-[2px] active:border-b-2";

/**
 * Tap a word on the left, then its partner on the right.
 *
 * The client has no answer key - that stays on the server - so a pairing cannot
 * be judged as it is made. Instead every pair is provisional and can be undone
 * by tapping it again; once all of them are linked the mapping is graded in one
 * go, which is also how the backend scores this type.
 */
export function MatchPairs({ payload, value, onChange, disabled }: MatchPairsProps) {
  const [pendingLeft, setPendingLeft] = useState<string | null>(null);

  const indexOfLeft = (word: string) => value.findIndex((pair) => pair.left === word);
  const indexOfRight = (word: string) => value.findIndex((pair) => pair.right === word);

  const selectLeft = (word: string) => {
    if (disabled) return;
    const existing = indexOfLeft(word);
    if (existing >= 0) {
      onChange(value.filter((_, index) => index !== existing));
      return;
    }
    setPendingLeft((current) => (current === word ? null : word));
  };

  const selectRight = (word: string) => {
    if (disabled) return;
    const existing = indexOfRight(word);
    if (existing >= 0) {
      onChange(value.filter((_, index) => index !== existing));
      return;
    }
    if (!pendingLeft) return;
    onChange([...value, { left: pendingLeft, right: word }]);
    setPendingLeft(null);
  };

  const columnTile = (word: string, pairIndex: number, pending: boolean) =>
    clsx(
      TILE,
      pairIndex >= 0
        ? PAIR_COLORS[pairIndex % PAIR_COLORS.length]
        : pending
          ? "border-info bg-info/10 text-info"
          : "border-line bg-surface hover:bg-ink/5",
      disabled && "cursor-default",
    );

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6">
      <div className="space-y-3">
        {payload.left.map((word) => {
          const pairIndex = indexOfLeft(word);
          return (
            <button
              key={word}
              type="button"
              disabled={disabled}
              lang="es"
              aria-pressed={pairIndex >= 0 || pendingLeft === word}
              onClick={() => selectLeft(word)}
              className={columnTile(word, pairIndex, pendingLeft === word)}
            >
              {word}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {payload.right.map((word) => {
          const pairIndex = indexOfRight(word);
          return (
            <button
              key={word}
              type="button"
              disabled={disabled}
              aria-pressed={pairIndex >= 0}
              onClick={() => selectRight(word)}
              className={columnTile(word, pairIndex, false)}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
