import clsx from "clsx";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { AchievementProgress } from "@/lib/types";

export function AchievementList({ achievements }: { achievements: AchievementProgress[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg">Achievements</h2>
      <Card className="divide-y-2 divide-line">
        {achievements.map((achievement) => {
          const unlocked = achievement.unlocked_at !== null;
          return (
            <div key={achievement.code} className="flex items-center gap-4 p-4">
              <span
                aria-hidden
                className={clsx(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 text-2xl",
                  unlocked ? "border-gold bg-gold/15" : "border-line bg-raised grayscale",
                )}
              >
                {achievement.icon}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={clsx("truncate text-base", !unlocked && "text-muted")}>
                    {achievement.title}
                  </p>
                  <span className="shrink-0 text-xs font-semibold text-muted">
                    {achievement.current}/{achievement.threshold}
                  </span>
                </div>
                <p className="mb-2 truncate text-xs font-semibold text-muted">
                  {achievement.description}
                </p>
                <ProgressBar
                  value={achievement.current}
                  max={achievement.threshold}
                  className="h-2"
                  label={`${achievement.title}: ${achievement.current} of ${achievement.threshold}`}
                />
              </div>
            </div>
          );
        })}
      </Card>
    </section>
  );
}
