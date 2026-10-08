"use client";

import clsx from "clsx";
import { Crown, Lock } from "lucide-react";
import { forwardRef } from "react";

import { skillIcon } from "@/components/path/skill-icons";
import { ProgressRing } from "@/components/path/ProgressRing";
import { darken } from "@/lib/theme";
import type { PathSkill } from "@/lib/types";

const NODE_SIZE = 70;
const COMPLETED_COLOR = "#FFC800";

interface SkillNodeProps {
  skill: PathSkill;
  unitColor: string;
  /** The first unlocked, unfinished skill in the whole path. */
  isCurrent: boolean;
  open: boolean;
  onToggle: () => void;
}

/**
 * One circular, pressable node on the path. The 3D effect is a thick bottom
 * border in a darker shade of the unit colour; pressing it collapses that
 * border, so the node appears to sink into the page.
 */
export const SkillNode = forwardRef<HTMLButtonElement, SkillNodeProps>(function SkillNode(
  { skill, unitColor, isCurrent, open, onToggle },
  ref,
) {
  const locked = skill.state === "locked";
  const completed = skill.state === "completed";
  const Icon = skillIcon(skill.icon);

  const face = completed ? COMPLETED_COLOR : unitColor;
  const colors = locked
    ? { background: "rgb(var(--locked))", borderBottomColor: "rgb(var(--locked-ink))" }
    : { background: face, borderBottomColor: darken(face, 0.22) };

  return (
    <div className="relative" style={{ width: NODE_SIZE, height: NODE_SIZE }}>
      {isCurrent && (
        <ProgressRing value={skill.total_lessons ? skill.lessons_completed / skill.total_lessons : 0} />
      )}

      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`${skill.title}, ${skill.state.replace("_", " ")}`}
        style={colors}
        className={clsx(
          "relative flex h-[70px] w-[70px] items-center justify-center rounded-full border-b-[6px] transition",
          "active:translate-y-[3px] active:border-b-[3px]",
          locked ? "text-locked-ink" : "text-white",
        )}
      >
        {locked ? (
          <Lock size={28} strokeWidth={3} aria-hidden />
        ) : completed ? (
          <Crown size={32} strokeWidth={2.75} aria-hidden />
        ) : (
          <Icon size={32} strokeWidth={2.75} aria-hidden />
        )}
      </button>
    </div>
  );
});
