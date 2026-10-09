"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import type { Guidebook } from "@/lib/types";

export const GUIDEBOOK_KEY = ["guidebook"] as const;

/**
 * The guidebook follows whichever course is current, so it is keyed on nothing
 * else: switching course already invalidates the path-shaped queries, and this
 * is one of them.
 */
export function useGuidebook() {
  return useQuery({
    queryKey: GUIDEBOOK_KEY,
    queryFn: () => apiGet<Guidebook>("/api/guidebook"),
  });
}
