"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import type { LearningPath } from "@/lib/types";

export const PATH_KEY = ["path"] as const;

export function usePath() {
  return useQuery({ queryKey: PATH_KEY, queryFn: () => apiGet<LearningPath>("/api/path") });
}
