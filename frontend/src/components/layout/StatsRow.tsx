"use client";

import { useState } from "react";

import {
  CoursePopover,
  GemsPopover,
  HeartsPopover,
  StreakPopover,
} from "@/components/layout/StatPopovers";
import { Flag } from "@/components/ui/Flag";
import { Popover } from "@/components/ui/Popover";
import { StatPill } from "@/components/ui/StatPill";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMe } from "@/hooks/useMe";

type StatKey = "course" | "streak" | "gems" | "hearts";

/**
 * The learner's headline figures. Shared by the desktop right rail and the
 * mobile top bar so there is one definition of each popover.
 */
export function StatsRow({ align = "center" }: { align?: "center" | "right" }) {
  const { data: me } = useMe();
  const [open, setOpen] = useState<StatKey | null>(null);

  if (!me) {
    return <Skeleton className="h-9 w-full" />;
  }

  const toggle = (key: StatKey) => setOpen((current) => (current === key ? null : key));
  const close = () => setOpen(null);

  return (
    <div className="flex items-center justify-between gap-1">
      <div className="relative">
        <StatPill
          icon={<Flag code={me.course?.language_code ?? ""} fallback={me.course?.flag_emoji} />}
          value={null}
          label={`Course: ${me.course?.title ?? "none"}`}
          onClick={() => toggle("course")}
        />
        <Popover open={open === "course"} onClose={close} align={align}>
          <CoursePopover me={me} />
        </Popover>
      </div>

      <div className="relative">
        <StatPill
          icon={"\u{1F525}"}
          value={<span className="text-flame">{me.streak}</span>}
          label={`${me.streak} day streak`}
          onClick={() => toggle("streak")}
        />
        <Popover open={open === "streak"} onClose={close} align={align}>
          <StreakPopover me={me} />
        </Popover>
      </div>

      <div className="relative">
        <StatPill
          icon={"\u{1F48E}"}
          value={<span className="text-info">{me.gems}</span>}
          label={`${me.gems} gems`}
          onClick={() => toggle("gems")}
        />
        <Popover open={open === "gems"} onClose={close} align={align}>
          <GemsPopover me={me} />
        </Popover>
      </div>

      <div className="relative">
        <StatPill
          icon={"❤️"}
          value={<span className="text-danger">{me.hearts}</span>}
          label={`${me.hearts} of ${me.max_hearts} hearts`}
          onClick={() => toggle("hearts")}
        />
        <Popover open={open === "hearts"} onClose={close} align={align}>
          <HeartsPopover me={me} onDone={close} />
        </Popover>
      </div>
    </div>
  );
}
