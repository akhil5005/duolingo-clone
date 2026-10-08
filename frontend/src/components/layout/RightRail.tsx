"use client";

import { DailyGoalCard } from "@/components/layout/DailyGoalCard";
import { LeaderboardPreviewCard } from "@/components/layout/LeaderboardPreviewCard";
import { StatsRow } from "@/components/layout/StatsRow";
import { SuperPromoCard } from "@/components/layout/SuperPromoCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMe } from "@/hooks/useMe";

export function RightRail() {
  const { data: me } = useMe();

  return (
    <aside className="sticky top-0 hidden h-screen w-[368px] shrink-0 space-y-4 px-6 py-6 xl:block">
      <StatsRow align="right" />
      {me ? <DailyGoalCard me={me} /> : <Skeleton className="h-36 w-full" />}
      <LeaderboardPreviewCard />
      <SuperPromoCard />
    </aside>
  );
}
