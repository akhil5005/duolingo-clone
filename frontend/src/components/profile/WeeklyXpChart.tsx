import { Card } from "@/components/ui/Card";
import type { DailyXp } from "@/lib/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Tallest a bar can draw, in pixels. */
const CHART_HEIGHT = 120;
const MIN_BAR_HEIGHT = 6;

/**
 * Seven days of XP as plain CSS bars - no chart library for one sparkline.
 *
 * Heights are in pixels rather than percentages: a percentage height needs a
 * parent with a resolved height, and these columns size to their content.
 */
export function WeeklyXpChart({ days }: { days: DailyXp[] }) {
  const peak = Math.max(1, ...days.map((day) => day.xp));

  return (
    <section className="space-y-3">
      <h2 className="text-lg">This week</h2>
      <Card className="p-4">
        <div className="flex items-end justify-between gap-2">
          {days.map((day) => {
            const label = DAY_LABELS[new Date(`${day.date}T00:00:00`).getDay()];
            const height = Math.max(MIN_BAR_HEIGHT, Math.round((day.xp / peak) * CHART_HEIGHT));
            return (
              <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-[11px] font-semibold text-muted">{day.xp || ""}</span>
                <div
                  role="img"
                  aria-label={`${label}: ${day.xp} XP`}
                  style={{ height }}
                  className="w-full rounded-t-lg bg-brand"
                />
                <span className="text-[11px] font-semibold text-muted">{label}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
