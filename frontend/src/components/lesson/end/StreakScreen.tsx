"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Button3D } from "@/components/ui/Button3D";
import { WEEKDAY_INITIALS } from "@/lib/format";
import type { Completion } from "@/lib/types";

/** Ticks the streak number from its old value up to the new one. */
function useTickTo(from: number, to: number): number {
  const [value, setValue] = useState(from);

  useEffect(() => {
    setValue(from);
    const timer = window.setTimeout(() => setValue(to), 600);
    return () => window.clearTimeout(timer);
  }, [from, to]);

  return value;
}

export function StreakScreen({
  summary,
  onContinue,
}: {
  summary: Completion;
  onContinue: () => void;
}) {
  const streak = useTickTo(summary.streak_before, summary.streak_after);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-flame px-6 py-10 text-center text-white">
      <motion.div
        initial={{ scale: 0.6, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 12 }}
        className="text-[96px] leading-none"
        aria-hidden
      >
        {"\u{1F525}"}
      </motion.div>

      <div>
        <motion.p
          key={streak}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-7xl font-extrabold"
        >
          {streak}
        </motion.p>
        <p className="text-2xl">day streak!</p>
      </div>

      <div className="flex w-full max-w-sm justify-between rounded-2xl bg-white/15 px-4 py-3">
        {summary.week_activity.map((active, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <span className="text-[11px] opacity-90">{WEEKDAY_INITIALS[index]}</span>
            <span
              aria-label={active ? "Practised" : "Not practised"}
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs",
                active ? "bg-white text-flame" : "bg-white/25",
              )}
            >
              {active ? "✓" : ""}
            </span>
          </div>
        ))}
      </div>

      <p className="max-w-xs text-sm font-semibold opacity-90">
        Practise again tomorrow to keep it going.
      </p>

      <Button3D
        variant="outline"
        size="lg"
        onClick={onContinue}
        className="w-full max-w-md !border-white !bg-white !text-flame"
      >
        Continue
      </Button3D>
    </div>
  );
}
