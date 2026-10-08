"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  /** Visible to screen readers as "x of y"; omit for purely decorative bars. */
  label?: string;
}

export function ProgressBar({ value, max = 1, className, label }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`relative h-4 w-full overflow-hidden rounded-full bg-line ${className ?? ""}`}
    >
      <motion.div
        className="relative h-full rounded-full bg-brand"
        initial={false}
        animate={{ width: `${ratio * 100}%` }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
      >
        {/* The lighter stripe along the top is what gives the fill its gloss. */}
        {ratio > 0.06 && (
          <span className="absolute left-2 right-2 top-[3px] h-[3px] rounded-full bg-white/40" />
        )}
      </motion.div>
    </div>
  );
}
