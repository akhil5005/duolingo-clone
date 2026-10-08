"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { LEADERBOARD_KEY } from "@/hooks/useLeaderboard";
import { ME_KEY } from "@/hooks/useMe";
import { PATH_KEY } from "@/hooks/usePath";
import { PROFILE_KEY } from "@/hooks/useProfile";
import { apiPost } from "@/lib/api";

interface AdvanceDayResult {
  today: string;
  day_offset: number;
}

/** Both tools move time or wipe progress, so every cached query is stale after. */
function useInvalidateEverything() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [ME_KEY, PATH_KEY, LEADERBOARD_KEY, PROFILE_KEY]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

export function useAdvanceDay() {
  const invalidate = useInvalidateEverything();
  return useMutation({
    mutationFn: (days: number) =>
      apiPost<AdvanceDayResult>("/api/debug/advance-day", { days }),
    onSuccess: invalidate,
  });
}

export function useResetDemo() {
  const invalidate = useInvalidateEverything();
  return useMutation({
    mutationFn: () => apiPost<{ status: string }>("/api/debug/reset"),
    onSuccess: invalidate,
  });
}
