"use client";

import Link from "next/link";

import { LeagueShield } from "@/components/leaderboard/LeagueShield";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { pluralise } from "@/lib/format";

export function LeaderboardPreviewCard() {
  const { data, isPending } = useLeaderboard();

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base">Leaderboard</h2>
        <Link href="/leaderboard" className="text-xs uppercase tracking-wide text-info">
          View league
        </Link>
      </div>

      {isPending || !data ? (
        <Skeleton className="h-14 w-full" />
      ) : (
        <div className="flex items-center gap-3">
          <LeagueShield size={44} />
          <div className="min-w-0">
            <p className="text-sm">{data.league_name}</p>
            <p className="text-xs font-semibold text-muted">
              {data.my_rank === null
                ? "Earn XP to join the league"
                : `You are #${data.my_rank} of ${data.rows.length}`}
              {" · "}
              {pluralise(data.days_left, "day")} left
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
