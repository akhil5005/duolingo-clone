"use client";

import { AchievementList } from "@/components/profile/AchievementList";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { WeeklyXpChart } from "@/components/profile/WeeklyXpChart";
import { Flag } from "@/components/ui/Flag";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProfile } from "@/hooks/useProfile";
import { initials } from "@/lib/format";

function joinedLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const { data, isPending, isError } = useProfile();

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="py-10 text-center text-sm text-muted">We could not load your profile.</p>;
  }

  const { user, stats } = data;

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4 border-b-2 border-line pb-6">
        <span
          aria-hidden
          style={{ backgroundColor: user.avatar_color }}
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl text-white"
        >
          {initials(user.display_name)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl">{user.display_name}</h1>
          <p className="text-sm font-semibold text-muted">@{user.username}</p>
          <p className="text-xs font-semibold text-muted">Joined {joinedLabel(stats.joined_at)}</p>
          {user.course && (
            <div className="mt-2 flex items-center gap-2">
              <Flag
                code={user.course.language_code}
                fallback={user.course.flag_emoji}
                className="h-4 w-6"
              />
              <span className="text-xs font-semibold text-muted">{user.course.title}</span>
            </div>
          )}
        </div>
      </header>

      <StatsGrid stats={stats} />
      <WeeklyXpChart days={data.xp_last_7_days} />
      <AchievementList achievements={data.achievements} />
    </div>
  );
}
