import clsx from "clsx";

import { initials } from "@/lib/format";
import type { LeaderboardRow as Row } from "@/lib/types";

const MEDALS: Record<number, string> = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };

export function LeaderboardRow({ row }: { row: Row }) {
  return (
    <li
      className={clsx(
        "flex items-center gap-3 rounded-xl px-3 py-2",
        row.is_me && "bg-info/10",
      )}
    >
      <span className="w-8 shrink-0 text-center text-base" aria-label={`Rank ${row.rank}`}>
        {MEDALS[row.rank] ?? row.rank}
      </span>

      <span
        aria-hidden
        style={{ backgroundColor: row.avatar_color }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm text-white"
      >
        {initials(row.display_name)}
      </span>

      <span className={clsx("min-w-0 flex-1 truncate text-sm", row.is_me && "text-info")}>
        {row.display_name}
        {row.is_me && <span className="ml-2 text-xs uppercase text-muted">you</span>}
      </span>

      <span className="shrink-0 text-sm text-muted">{row.xp} XP</span>
    </li>
  );
}
