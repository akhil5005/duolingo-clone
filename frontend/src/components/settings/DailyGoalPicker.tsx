"use client";

import clsx from "clsx";

const GOALS = [
  { xp: 10, label: "Casual" },
  { xp: 20, label: "Regular" },
  { xp: 30, label: "Serious" },
  { xp: 50, label: "Intense" },
] as const;

interface DailyGoalPickerProps {
  value: number;
  onChange: (xp: number) => void;
  disabled?: boolean;
}

export function DailyGoalPicker({ value, onChange, disabled }: DailyGoalPickerProps) {
  return (
    <div role="radiogroup" aria-label="Daily goal" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {GOALS.map((goal) => {
        const selected = goal.xp === value;
        return (
          <button
            key={goal.xp}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(goal.xp)}
            className={clsx(
              "rounded-2xl border-2 border-b-4 px-3 py-3 text-center transition",
              selected
                ? "border-brand bg-brand/10 text-brand-dark"
                : "border-line bg-surface hover:bg-ink/5",
            )}
          >
            <span className="block text-sm">{goal.label}</span>
            <span className="block text-xs font-semibold text-muted">{goal.xp} XP a day</span>
          </button>
        );
      })}
    </div>
  );
}
