"use client";

import { CalendarPlus, RotateCcw } from "lucide-react";

import { Button3D } from "@/components/ui/Button3D";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useAdvanceDay, useResetDemo } from "@/hooks/useDebugTools";

/**
 * Streaks and heart regeneration play out over days, which a demo does not
 * have. These tools move the server's clock instead of faking the rules, so
 * what you see is the real behaviour, just sooner.
 */
export function DeveloperTools() {
  const toast = useToast();
  const advance = useAdvanceDay();
  const reset = useResetDemo();
  const busy = advance.isPending || reset.isPending;

  return (
    <Card className="space-y-4 border-grape/40 bg-grape/5 p-4">
      <div>
        <h2 className="text-base text-grape-dark">Developer tools</h2>
        <p className="text-xs font-semibold text-muted">
          Time-travel the demo. Every date rule reads one clock, so these are the real rules
          running a day later.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button3D
          variant="super"
          size="sm"
          fullWidth
          disabled={busy}
          onClick={() =>
            advance.mutate(1, {
              onSuccess: (result) =>
                toast({
                  variant: "info",
                  icon: "\u{1F5D3}",
                  title: "Moved to the next day",
                  description: `Today is now ${result.today}`,
                }),
            })
          }
        >
          <CalendarPlus size={16} strokeWidth={3} aria-hidden />
          Simulate next day
        </Button3D>

        <Button3D
          variant="outline"
          size="sm"
          fullWidth
          disabled={busy}
          onClick={() =>
            reset.mutate(undefined, {
              onSuccess: () =>
                toast({
                  variant: "success",
                  icon: "✨",
                  title: "Demo progress reset",
                  description: "Back to the seeded learner",
                }),
            })
          }
        >
          <RotateCcw size={16} strokeWidth={3} aria-hidden />
          Reset demo progress
        </Button3D>
      </div>
    </Card>
  );
}
