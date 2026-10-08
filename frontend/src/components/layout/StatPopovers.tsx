"use client";

import clsx from "clsx";
import { Heart } from "lucide-react";
import Link from "next/link";

import { Button3D } from "@/components/ui/Button3D";
import { useRefillHearts } from "@/hooks/useMe";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown, WEEKDAY_INITIALS } from "@/lib/format";
import type { Me } from "@/lib/types";

const HEART_REFILL_COST = 350;

export function CoursePopover({ me }: { me: Me }) {
  return (
    <div className="space-y-3 text-left">
      <p className="text-xs uppercase tracking-widest text-muted">My courses</p>
      <div className="flex items-center gap-3 rounded-xl border-2 border-info/40 bg-info/10 px-3 py-2">
        <span className="text-2xl" aria-hidden>
          {me.course?.flag_emoji}
        </span>
        <span className="text-sm">{me.course?.title}</span>
      </div>
      <p className="text-xs font-semibold text-muted">More languages are coming soon.</p>
    </div>
  );
}

export function StreakPopover({ me }: { me: Me }) {
  return (
    <div className="space-y-3 text-left">
      <p className="text-sm">
        {me.streak === 0 ? "Start a new streak today!" : `${me.streak} day streak!`}
      </p>
      <div className="flex justify-between gap-1">
        {me.week_activity.map((active, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-extrabold text-muted">
              {WEEKDAY_INITIALS[index]}
            </span>
            <span
              aria-hidden
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs",
                active ? "bg-flame text-white" : "bg-line text-locked-ink",
              )}
            >
              {active ? "\u{1F525}" : ""}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold text-muted">
        Practise every day so your streak doesn&apos;t reset. Longest so far:{" "}
        {me.longest_streak} days.
      </p>
    </div>
  );
}

export function GemsPopover({ me }: { me: Me }) {
  return (
    <div className="space-y-2 text-left">
      <p className="text-sm">{me.gems} gems</p>
      <p className="text-xs font-semibold text-muted">
        Gems are mocked in this build. Spend them on a heart refill from the shop.
      </p>
      <Link href="/shop" className="inline-block text-xs uppercase tracking-wide text-info">
        Go to shop
      </Link>
    </div>
  );
}

export function HeartsPopover({ me, onDone }: { me: Me; onDone: () => void }) {
  const remaining = useCountdown(me.next_heart_at, me.server_now);
  const refill = useRefillHearts();
  const full = me.hearts >= me.max_hearts;
  const affordable = me.gems >= HEART_REFILL_COST;

  return (
    <div className="space-y-3 text-left">
      <p className="text-sm">{full ? "Hearts full!" : `${me.hearts} hearts left`}</p>
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: me.max_hearts }, (_, index) => (
          <Heart
            key={index}
            size={20}
            className={index < me.hearts ? "text-danger" : "text-line"}
            fill={index < me.hearts ? "currentColor" : "none"}
            strokeWidth={2.5}
          />
        ))}
      </div>

      <p className="text-xs font-semibold text-muted">
        {full
          ? "You have every heart. Keep them by answering carefully!"
          : `Next heart in ${formatCountdown(remaining)}`}
      </p>

      {!full && (
        <Button3D
          variant={affordable ? "secondary" : "locked"}
          size="sm"
          fullWidth
          disabled={!affordable || refill.isPending}
          onClick={() => refill.mutate(undefined, { onSuccess: onDone })}
        >
          Refill for {HEART_REFILL_COST} gems
        </Button3D>
      )}
      {!full && !affordable && (
        <p className="text-xs font-semibold text-danger">
          You need {HEART_REFILL_COST - me.gems} more gems.
        </p>
      )}
    </div>
  );
}
