"use client";

import { Fragment } from "react";

import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";
import { LeagueHeader } from "@/components/leaderboard/LeagueHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLeaderboard } from "@/hooks/useLeaderboard";

function ZoneDivider({ label, tone }: { label: string; tone: "promotion" | "demotion" }) {
  const colour = tone === "promotion" ? "text-brand" : "text-danger";
  const rule = tone === "promotion" ? "bg-brand/40" : "bg-danger/40";

  return (
    <li className="flex items-center gap-3 py-2" aria-hidden>
      <span className={`h-[2px] flex-1 ${rule}`} />
      <span className={`text-[11px] uppercase tracking-wider ${colour}`}>{label}</span>
      <span className={`h-[2px] flex-1 ${rule}`} />
    </li>
  );
}

export default function LeaderboardPage() {
  const { data, isPending, isError } = useLeaderboard();

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="py-10 text-center text-sm text-muted">We could not load the league.</p>;
  }

  return (
    <div className="space-y-5">
      <LeagueHeader leagueName={data.league_name} daysLeft={data.days_left} />

      <ol className="space-y-1">
        {data.rows.map((row) => (
          <Fragment key={row.user_id}>
            {row.rank === data.promotion_cutoff + 1 && (
              <ZoneDivider label="Promotion zone" tone="promotion" />
            )}
            {row.rank === data.demotion_cutoff + 1 && (
              <ZoneDivider label="Demotion zone" tone="demotion" />
            )}
            <LeaderboardRow row={row} />
          </Fragment>
        ))}
      </ol>
    </div>
  );
}
