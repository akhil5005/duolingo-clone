import Link from "next/link";
import { BookOpen } from "lucide-react";

import { darken } from "@/lib/theme";
import type { PathUnit } from "@/lib/types";

export function UnitBanner({ unit }: { unit: PathUnit }) {
  return (
    <div
      style={{ backgroundColor: unit.color_hex, borderBottomColor: darken(unit.color_hex, 0.2) }}
      className="sticky top-14 z-20 mb-8 flex items-center justify-between gap-4 rounded-2xl border-b-4 px-5 py-4 text-white xl:top-0"
    >
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] opacity-85">
          Section 1, Unit {unit.order_index}
        </p>
        <h2 className="truncate text-xl">{unit.title}</h2>
        <p className="text-xs font-semibold opacity-90">
          {unit.completed_skills}/{unit.total_skills} skills complete
        </p>
      </div>

      <Link
        href="/guidebook"
        aria-label="Open the unit guidebook"
        className="flex shrink-0 items-center gap-2 rounded-xl border-2 border-white/60 px-3 py-2 text-[11px] uppercase tracking-wide transition hover:bg-white/15"
      >
        <BookOpen size={16} strokeWidth={3} aria-hidden />
        <span className="hidden sm:inline">Guidebook</span>
      </Link>
    </div>
  );
}
