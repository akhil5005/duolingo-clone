"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import type { Leaderboard } from "@/lib/types";

export const LEADERBOARD_KEY = ["leaderboard"] as const;

export function useLeaderboard() {
  return useQuery({
    queryKey: LEADERBOARD_KEY,
    queryFn: () => apiGet<Leaderboard>("/api/leaderboard"),
  });
}
