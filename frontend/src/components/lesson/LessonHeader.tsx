"use client";

import { Heart, Infinity as InfinityIcon, X } from "lucide-react";

import { ComboBadge } from "@/components/lesson/ComboBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SessionMode } from "@/lib/types";

interface LessonHeaderProps {
  mode: SessionMode;
  progress: number;
  hearts: number;
  comboMilestone: number | null;
  onQuit: () => void;
}

export function LessonHeader({
  mode,
  progress,
  hearts,
  comboMilestone,
  onQuit,
}: LessonHeaderProps) {
  // Practice can never cost a heart, so the counter becomes an infinity symbol.
  const unlimited = mode !== "lesson";

  return (
    <header className="flex items-center gap-4 px-4 py-4 md:px-0">
      <button
        type="button"
        onClick={onQuit}
        aria-label="Quit this lesson"
        className="rounded-xl p-1 text-muted transition hover:text-ink"
      >
        <X size={30} strokeWidth={3} aria-hidden />
      </button>

      <div className="relative flex-1">
        <ProgressBar value={progress} label="Lesson progress" />
        <ComboBadge combo={comboMilestone} />
      </div>

      <div className="flex items-center gap-1 text-danger">
        <Heart size={26} fill="currentColor" strokeWidth={2.5} aria-hidden />
        <span className="text-lg" aria-label={unlimited ? "Unlimited hearts" : `${hearts} hearts`}>
          {unlimited ? <InfinityIcon size={20} strokeWidth={3} aria-hidden /> : hearts}
        </span>
      </div>
    </header>
  );
}
