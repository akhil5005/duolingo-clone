"use client";

import { useEffect, useState } from "react";

import { DailyGoalPicker } from "@/components/settings/DailyGoalPicker";
import { DeveloperTools } from "@/components/settings/DeveloperTools";
import { ComingSoonRow, SettingsRow } from "@/components/settings/SettingsRow";
import { Button3D } from "@/components/ui/Button3D";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toggle } from "@/components/ui/Toggle";
import { useMe, useUpdateMe } from "@/hooks/useMe";
import { useThemeMode } from "@/hooks/useThemeMode";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg">{title}</h2>
      <Card className="divide-y-2 divide-line px-4">{children}</Card>
    </section>
  );
}

export default function SettingsPage() {
  const { data: me, isPending } = useMe();
  const update = useUpdateMe();
  const theme = useThemeMode();
  const [displayName, setDisplayName] = useState("");

  // Seed the input once the learner arrives, then leave it to the user.
  useEffect(() => {
    if (me) setDisplayName(me.display_name);
  }, [me]);

  if (isPending || !me) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const nameChanged = displayName.trim().length > 0 && displayName !== me.display_name;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl">Settings</h1>

      <Section title="Preferences">
        <SettingsRow title="Sound effects" description="Play a tone after each answer">
          <Toggle
            checked={me.sound_enabled}
            disabled={update.isPending}
            label="Sound effects"
            onChange={(sound_enabled) => update.mutate({ sound_enabled })}
          />
        </SettingsRow>
        <SettingsRow title="Dark mode" description="Easier on the eyes at night">
          <Toggle
            checked={theme.mode === "dark"}
            label="Dark mode"
            onChange={(dark) => theme.setMode(dark ? "dark" : "light")}
          />
        </SettingsRow>
        <ComingSoonRow title="Notifications" />
        <ComingSoonRow title="Privacy settings" />
        <ComingSoonRow title="Manage subscription" />
      </Section>

      <section className="space-y-3">
        <h2 className="text-lg">Daily goal</h2>
        <DailyGoalPicker
          value={me.daily_goal_xp}
          disabled={update.isPending}
          onChange={(daily_goal_xp) => update.mutate({ daily_goal_xp })}
        />
      </section>

      <Section title="Profile">
        <SettingsRow title="Display name">
          <div className="flex items-center gap-2">
            <input
              value={displayName}
              maxLength={40}
              aria-label="Display name"
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-40 rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-info"
            />
            <Button3D
              variant="primary"
              size="sm"
              disabled={!nameChanged || update.isPending}
              onClick={() => update.mutate({ display_name: displayName.trim() })}
            >
              Save
            </Button3D>
          </div>
        </SettingsRow>
        <SettingsRow title="Username" description={`@${me.username}`} />
      </Section>

      {me.debug_tools_enabled && <DeveloperTools />}
    </div>
  );
}
