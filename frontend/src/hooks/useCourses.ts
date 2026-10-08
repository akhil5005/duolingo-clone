"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LEADERBOARD_KEY } from "@/hooks/useLeaderboard";
import { ME_KEY } from "@/hooks/useMe";
import { PATH_KEY } from "@/hooks/usePath";
import { PROFILE_KEY } from "@/hooks/useProfile";
import { apiGet, apiPatch } from "@/lib/api";
import type { CourseSummary, Me } from "@/lib/types";

export const COURSES_KEY = ["courses"] as const;

export function useCourses() {
  return useQuery({
    queryKey: COURSES_KEY,
    queryFn: () => apiGet<CourseSummary[]>("/api/courses"),
  });
}

/**
 * Switching course changes which path is shown, nothing else: XP, hearts, gems
 * and the streak belong to the learner, so only the path-shaped queries move.
 */
export function useSwitchCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) =>
      apiPatch<Me>("/api/me", { current_course_id: courseId }),
    onSuccess: (me) => {
      queryClient.setQueryData(ME_KEY, me);
      for (const key of [PATH_KEY, COURSES_KEY, PROFILE_KEY, LEADERBOARD_KEY]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
