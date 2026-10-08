"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import type { Profile } from "@/lib/types";

export const PROFILE_KEY = ["profile"] as const;

export function useProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: () => apiGet<Profile>("/api/profile") });
}
