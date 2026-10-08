"use client";

import Link from "next/link";

import { Button3D } from "@/components/ui/Button3D";
import { Popover } from "@/components/ui/Popover";
import type { PathSkill } from "@/lib/types";

interface NodePopoverProps {
  skill: PathSkill;
  unitColor: string;
  open: boolean;
  onClose: () => void;
}

function subtitle(skill: PathSkill): string {
  if (skill.state === "locked") return "Complete all levels above to unlock this!";
  if (skill.state === "completed") return "You finished every lesson in this skill.";
  return `Lesson ${skill.lessons_completed + 1} of ${skill.total_lessons}`;
}

/** The panel that opens under a node, tinted with its unit colour. */
export function NodePopover({ skill, unitColor, open, onClose }: NodePopoverProps) {
  const practiceHref = `/lesson/0?mode=practice&skill=${skill.id}`;
  const legendaryHref = `/lesson/0?mode=legendary&skill=${skill.id}`;

  return (
    <Popover open={open} onClose={onClose} accent={unitColor}>
      <p style={{ color: unitColor }} className="text-base">
        {skill.title}
      </p>
      <p className="mb-3 mt-1 text-xs font-semibold text-muted">{subtitle(skill)}</p>

      {skill.state === "locked" && (
        <Button3D variant="locked" size="sm" fullWidth>
          Locked
        </Button3D>
      )}

      {(skill.state === "available" || skill.state === "in_progress") &&
        skill.next_lesson_id !== null && (
          <Link href={`/lesson/${skill.next_lesson_id}`} onClick={onClose}>
            <Button3D variant="primary" size="sm" fullWidth>
              Start +10 XP
            </Button3D>
          </Link>
        )}

      {skill.state === "completed" && (
        <div className="space-y-2">
          <Link href={practiceHref} onClick={onClose}>
            <Button3D variant="primary" size="sm" fullWidth>
              Practice +5 XP
            </Button3D>
          </Link>
          <Link href={legendaryHref} onClick={onClose}>
            <Button3D variant="super" size="sm" fullWidth>
              Legendary +40 XP
            </Button3D>
          </Link>
        </div>
      )}
    </Popover>
  );
}
