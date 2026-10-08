"use client";

import clsx from "clsx";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-7 w-12 shrink-0 rounded-full border-2 transition",
        checked ? "border-brand-dark bg-brand" : "border-line bg-raised",
        disabled && "opacity-50",
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "absolute top-[2px] h-5 w-5 rounded-full bg-white shadow transition-all",
          checked ? "left-[22px]" : "left-[2px]",
        )}
      />
    </button>
  );
}
