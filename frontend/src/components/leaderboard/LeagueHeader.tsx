import clsx from "clsx";

import { LeagueShield } from "@/components/leaderboard/LeagueShield";
import { pluralise } from "@/lib/format";

/** The ladder this build ships; only the first is reachable. */
const LEAGUES = ["Bronze", "Silver", "Gold", "Sapphire", "Ruby", "Diamond"] as const;

interface LeagueHeaderProps {
  leagueName: string;
  daysLeft: number;
}

export function LeagueHeader({ leagueName, daysLeft }: LeagueHeaderProps) {
  return (
    <header className="flex flex-col items-center gap-3 border-b-2 border-line pb-6 text-center">
      <div className="no-scrollbar flex w-full items-end justify-center gap-3 overflow-x-auto px-2">
        {LEAGUES.map((league, index) => (
          <div key={league} className="flex shrink-0 flex-col items-center gap-1">
            <LeagueShield size={index === 0 ? 56 : 40} locked={index > 0} />
            <span
              className={clsx(
                "text-[10px] uppercase tracking-wide",
                index === 0 ? "text-ink" : "text-locked-ink",
              )}
            >
              {league}
            </span>
          </div>
        ))}
      </div>

      <h1 className="text-2xl">{leagueName}</h1>
      <p className="text-sm font-semibold text-muted">
        Top 5 advance to the next league
      </p>
      <p className="text-xs uppercase tracking-wide text-flame">
        {pluralise(daysLeft, "day")} left
      </p>
    </header>
  );
}
