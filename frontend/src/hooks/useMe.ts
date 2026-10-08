"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Me, MePatch } from "@/lib/types";

export const ME_KEY = ["me"] as const;

export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: () => apiGet<Me>("/api/me") });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: MePatch) => apiPatch<Me>("/api/me", patch),
    onSuccess: (me) => queryClient.setQueryData(ME_KEY, me),
  });
}

export function useRefillHearts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<Me>("/api/me/hearts/refill"),
    onSuccess: (me) => queryClient.setQueryData(ME_KEY, me),
  });
}
