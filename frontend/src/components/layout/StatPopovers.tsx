"use client";

import clsx from "clsx";
import { Check, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button3D } from "@/components/ui/Button3D";
import { Flag } from "@/components/ui/Flag";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCourses, useSwitchCourse } from "@/hooks/useCourses";
import { useRefillHearts } from "@/hooks/useMe";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown, WEEKDAY_INITIALS } from "@/lib/format";
import type { Me } from "@/lib/types";

const HEART_REFILL_COST = 350;

export function CoursePopover({ onDone }: { onDone: () => void }) {
  const { data: courses, isPending } = useCourses();
  const switchCourse = useSwitchCourse();

  if (isPending || !courses) {
    return <Skeleton className="h-24 w-full" />;
  }

  return (
    <div className="space-y-2 text-left">
      <p className="text-xs uppercase tracking-widest text-muted">My courses</p>
      {courses.map((course) => (
        <button
          key={course.id}
          type="button"
          disabled={switchCourse.isPending}
          aria-current={course.is_current ? "true" : undefined}
          onClick={() =>
            course.is_current
              ? onDone()
              : switchCourse.mutate(course.id, { onSuccess: onDone })
          }
          className={clsx(
            "flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition",
            course.is_current
              ? "border-info/40 bg-info/10"
              : "border-transparent hover:bg-ink/5",
          )}
        >
          <Flag code={course.language_code} fallback={course.flag_emoji} className="h-6 w-9" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{course.title}</span>
            <span className="block text-xs font-semibold text-muted">
              {course.completed_skills}/{course.total_skills} skills
            </span>
          </span>
          {course.is_current && <Check size={18} strokeWidth={3} className="text-info" />}
        </button>
      ))}
      <p className="pt-1 text-xs font-semibold text-muted">
        Your XP, hearts and streak follow you between courses.
      </p>
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
  const router = useRouter();
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

      {!full && (
        <Button3D
          variant="primary"
          size="sm"
          fullWidth
          onClick={() => {
            onDone();
            // skill 0 means "anything I have started"
            router.push("/lesson/0?mode=practice&skill=0");
          }}
        >
          Practice to earn hearts
        </Button3D>
      )}
    </div>
  );
}
