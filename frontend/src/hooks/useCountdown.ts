"use client";

import { useEffect, useState } from "react";

/**
 * Milliseconds left until `target`, ticking once a second.
 *
 * `serverNow` is the backend's clock at the moment the data was fetched. The
 * countdown is measured against it rather than the browser clock, because the
 * "simulate next day" developer tool shifts the server's day forward and the two
 * clocks would otherwise disagree by whole days.
 */
export function useCountdown(target: string | null, serverNow: string): number {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!target) {
      setRemaining(0);
      return;
    }

    const skew = Date.now() - new Date(serverNow).getTime();
    const deadline = new Date(target).getTime() + skew;
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [target, serverNow]);

  return remaining;
}
