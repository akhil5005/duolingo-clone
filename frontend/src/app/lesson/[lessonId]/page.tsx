"use client";

import { useParams, useSearchParams } from "next/navigation";

import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import type { SessionMode } from "@/lib/types";

const MODES: SessionMode[] = ["lesson", "practice", "legendary"];

/**
 * The lesson player runs full screen, outside the (main) shell, so nothing
 * competes with the exercise. Practice and legendary runs reuse this route with
 * `?mode=…&skill=…`, because from here on the three modes behave identically.
 */
export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const search = useSearchParams();

  const requested = search.get("mode");
  const mode: SessionMode = MODES.includes(requested as SessionMode)
    ? (requested as SessionMode)
    : "lesson";
  const skillId = Number(search.get("skill") ?? 0);

  return (
    <LessonPlayer
      mode={mode}
      lessonId={params.lessonId}
      skillId={Number.isFinite(skillId) ? skillId : 0}
    />
  );
}
