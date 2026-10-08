"use client";

import { StatsRow } from "@/components/layout/StatsRow";
import { Wordmark } from "@/components/layout/Wordmark";

/** The compact header used below the desktop breakpoint, where no rail fits. */
export function TopStatsBar() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-surface px-4 py-2 xl:hidden">
      <div className="mx-auto flex max-w-[600px] items-center gap-3">
        <Wordmark className="hidden text-xl sm:block md:hidden" />
        <div className="min-w-0 flex-1">
          <StatsRow align="right" />
        </div>
      </div>
    </header>
  );
}
