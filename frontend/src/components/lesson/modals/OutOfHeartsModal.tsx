"use client";

import { useRouter } from "next/navigation";

import { Mascot } from "@/components/mascot/Mascot";
import { Button3D } from "@/components/ui/Button3D";
import { Modal } from "@/components/ui/Modal";
import { useMe, useRefillHearts } from "@/hooks/useMe";

const HEART_REFILL_COST = 350;

export function OutOfHeartsModal({ open, skillId }: { open: boolean; skillId: number }) {
  const router = useRouter();
  const { data: me } = useMe();
  const refill = useRefillHearts();
  const affordable = (me?.gems ?? 0) >= HEART_REFILL_COST;

  return (
    <Modal open={open} dismissible={false} label="You ran out of hearts">
      <div className="flex flex-col items-center gap-4 text-center">
        <Mascot expression="sad" size={116} />
        <h2 className="text-xl">You ran out of hearts!</h2>
        <p className="text-sm font-semibold text-muted">
          Refill with gems, or practise an earlier skill to earn one back.
        </p>

        <Button3D
          variant={affordable ? "secondary" : "locked"}
          size="lg"
          fullWidth
          disabled={!affordable || refill.isPending}
          onClick={() => refill.mutate(undefined, { onSuccess: () => router.refresh() })}
        >
          Refill for {HEART_REFILL_COST} gems
        </Button3D>
        <Button3D
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => router.push(`/lesson/0?mode=practice&skill=${skillId}`)}
        >
          Practice to earn hearts
        </Button3D>
        <Button3D variant="ghost" size="lg" fullWidth onClick={() => router.push("/learn")}>
          No thanks
        </Button3D>
      </div>
    </Modal>
  );
}
