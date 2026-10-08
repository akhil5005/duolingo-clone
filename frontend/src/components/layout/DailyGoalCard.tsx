"use client";

import { Zap } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Me } from "@/lib/types";

export function DailyGoalCard({ me }: { me: Me }) {
  const reached = me.today_xp >= me.daily_goal_xp;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base">Daily goal</h2>
        <span className="text-xs uppercase tracking-wide text-muted">
          {me.today_xp}/{me.daily_goal_xp} XP
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20"
          aria-hidden
        >
          <Zap size={22} className="text-gold" fill="currentColor" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <ProgressBar
            value={me.today_xp}
            max={me.daily_goal_xp}
            label={`${me.today_xp} of ${me.daily_goal_xp} XP earned today`}
          />
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold text-muted">
        {reached
          ? "Goal complete — nice work! Keep going for bonus XP."
          : `Earn ${me.daily_goal_xp - me.today_xp} more XP to hit today's goal.`}
      </p>
    </Card>
  );
}
