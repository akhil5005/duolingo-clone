"use client";

import { useSyncExternalStore } from "react";

import { hasSlowRequest, hasSlowRequestOnServer, subscribeToSlowRequests } from "@/lib/api";

/** True while any request has been in flight for more than three seconds. */
export function useSlowRequest(): boolean {
  return useSyncExternalStore(subscribeToSlowRequests, hasSlowRequest, hasSlowRequestOnServer);
}
