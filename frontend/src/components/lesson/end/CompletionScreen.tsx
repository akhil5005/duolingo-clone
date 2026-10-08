"use client";

import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

import { Mascot } from "@/components/mascot/Mascot";
import { Button3D } from "@/components/ui/Button3D";
import { formatDuration } from "@/lib/format";
import type { Completion } from "@/lib/types";

interface StatCardProps {
  label: string;
  value: string;
  tone: "gold" | "brand" | "info";
}

const TONES: Record<StatCardProps["tone"], { head: string; body: string }> = {
  gold: { head: "bg-gold text-ink", body: "border-gold text-gold-dark" },
  brand: { head: "bg-brand text-white", body: "border-brand text-brand-dark" },
  info: { head: "bg-info text-white", body: "border-info text-info" },
};

function StatCard({ label, value, tone }: StatCardProps) {
  const colors = TONES[tone];
  return (
    <div className={`overflow-hidden rounded-2xl border-2 ${colors.body}`}>
      <p className={`px-3 py-1 text-[11px] uppercase tracking-wider ${colors.head}`}>{label}</p>
      <p className="px-3 py-2 text-xl">{value}</p>
    </div>
  );
}

/** Counts a number up so the XP total lands with some weight. */
function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * ratio));
      if (ratio < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

export function CompletionScreen({
  summary,
  onContinue,
}: {
  summary: Completion;
  onContinue: () => void;
}) {
  const perfect = summary.accuracy === 100;
  const xp = useCountUp(summary.xp_earned);

  useEffect(() => {
    void confetti({
      particleCount: perfect ? 160 : 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#58CC02", "#1CB0F6", "#FFC800", "#CE82FF", "#FF9600"],
    });
  }, [perfect]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <Mascot expression="celebrating" size={150} />
      <h1 className="text-3xl text-gold">{perfect ? "Perfect lesson!" : "Lesson complete!"}</h1>

      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        <StatCard label="Total XP" value={String(xp)} tone="gold" />
        <StatCard
          label={perfect ? "Amazing" : "Good"}
          value={`${summary.accuracy}%`}
          tone="brand"
        />
        <StatCard
          label={summary.duration_seconds < 90 ? "Speedy" : "Quick"}
          value={formatDuration(summary.duration_seconds)}
          tone="info"
        />
      </div>

      <ul className="w-full max-w-md space-y-1 text-sm font-semibold text-muted">
        {summary.xp_breakdown.map((line) => (
          <li key={line.label} className="flex justify-between">
            <span>{line.label}</span>
            <span className="text-gold-dark">+{line.amount} XP</span>
          </li>
        ))}
      </ul>

      <Button3D variant="primary" size="lg" onClick={onContinue} className="w-full max-w-md">
        Continue
      </Button3D>
    </div>
  );
}
