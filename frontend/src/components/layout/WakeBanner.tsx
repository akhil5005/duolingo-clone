"use client";

import { Loader2 } from "lucide-react";

import { useSlowRequest } from "@/hooks/useSlowRequest";

/**
 * The API is hosted on a free instance that sleeps after 15 minutes idle and
 * can take up to a minute to answer the first request. Rather than leave the
 * screen looking broken, say what is happening.
 */
export function WakeBanner() {
  const slow = useSlowRequest();
  if (!slow) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-gold px-4 py-2 text-center text-xs text-ink"
    >
      <Loader2 size={16} className="animate-spin" aria-hidden />
      Waking up the server… this can take up to a minute on the free tier.
    </div>
  );
}
