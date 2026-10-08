"use client";

import { Target, Users, Zap } from "lucide-react";

import { Mascot } from "@/components/mascot/Mascot";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMe } from "@/hooks/useMe";

export default function QuestsPage() {
  const { data: me, isPending } = useMe();

  if (isPending || !me) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const reached = me.today_xp >= me.daily_goal_xp;

  return (
    <div className="space-y-8">
      <h1 className="border-b-2 border-line pb-4 text-2xl">Quests</h1>

      <section className="space-y-3">
        <h2 className="text-lg">Daily quest</h2>
        <Card className="flex items-center gap-4 p-4">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-gold-dark"
          >
            <Zap size={28} fill="currentColor" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base">Earn {me.daily_goal_xp} XP</p>
            <p className="mb-2 text-xs font-semibold text-muted">
              {reached
                ? "Complete — see you again tomorrow!"
                : `${me.daily_goal_xp - me.today_xp} XP to go`}
            </p>
            <ProgressBar
              value={me.today_xp}
              max={me.daily_goal_xp}
              className="h-3"
              label={`${me.today_xp} of ${me.daily_goal_xp} XP today`}
            />
          </div>
          <span className="shrink-0 text-xs font-semibold text-muted">
            {me.today_xp}/{me.daily_goal_xp}
          </span>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg">Friend quests</h2>
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <Mascot expression="thinking" size={96} />
          <p className="flex items-center gap-2 text-base">
            <Users size={18} strokeWidth={3} aria-hidden />
            Team up with a friend
          </p>
          <p className="max-w-sm text-xs font-semibold text-muted">
            Friend quests arrive with the social features. Coming soon.
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg">Monthly challenge</h2>
        <Card className="flex items-center gap-4 p-4">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-grape/15 text-grape"
          >
            <Target size={28} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base">Monthly badge</p>
            <p className="text-xs font-semibold text-muted">Earn a badge every month</p>
          </div>
          <span className="shrink-0 rounded-full bg-raised px-3 py-1 text-[11px] uppercase tracking-wide text-muted">
            Coming soon
          </span>
        </Card>
      </section>
    </div>
  );
}
