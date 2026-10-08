"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

interface StatPillProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

/** One figure in the stats bar: an icon, a number, and an optional popover. */
export function StatPill({ icon, value, label, onClick, className }: StatPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        "flex items-center gap-1.5 rounded-xl px-2 py-1 text-base font-extrabold transition hover:bg-ink/5",
        className,
      )}
    >
      <span aria-hidden className="text-xl leading-none">
        {icon}
      </span>
      {value}
    </button>
  );
}
