"use client";

import { Heart, Snowflake, Sparkles, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button3D } from "@/components/ui/Button3D";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useMe, useRefillHearts } from "@/hooks/useMe";

const HEART_REFILL_COST = 350;

interface ShopItemProps {
  icon: LucideIcon;
  tint: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function ShopItem({ icon: Icon, tint, title, description, children }: ShopItemProps) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <span
        aria-hidden
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tint}`}
      >
        <Icon size={28} strokeWidth={2.5} fill="currentColor" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base">{title}</p>
        <p className="text-xs font-semibold text-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </Card>
  );
}

function ComingSoonBadge() {
  return (
    <span className="rounded-full bg-raised px-3 py-1 text-[11px] uppercase tracking-wide text-muted">
      Coming soon
    </span>
  );
}

export default function ShopPage() {
  const { data: me, isPending } = useMe();
  const refill = useRefillHearts();
  const toast = useToast();

  if (isPending || !me) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const full = me.hearts >= me.max_hearts;
  const affordable = me.gems >= HEART_REFILL_COST;

  return (
    <div className="space-y-8">
      <header className="flex items-baseline justify-between border-b-2 border-line pb-4">
        <h1 className="text-2xl">Shop</h1>
        <p className="text-sm text-info">
          <span aria-hidden>{"\u{1F48E}"}</span> {me.gems} gems
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg">Hearts</h2>
        <ShopItem
          icon={Heart}
          tint="bg-danger/15 text-danger"
          title="Refill hearts"
          description={
            full ? "Your hearts are already full" : `You have ${me.hearts} of ${me.max_hearts}`
          }
        >
          <Button3D
            variant={!full && affordable ? "secondary" : "locked"}
            size="sm"
            disabled={full || !affordable || refill.isPending}
            onClick={() =>
              refill.mutate(undefined, {
                onSuccess: () =>
                  toast({
                    variant: "success",
                    icon: "❤️",
                    title: "Hearts refilled",
                    description: `${HEART_REFILL_COST} gems spent`,
                  }),
              })
            }
          >
            {full ? "Full" : `${HEART_REFILL_COST} gems`}
          </Button3D>
        </ShopItem>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg">Power-ups</h2>
        <ShopItem
          icon={Snowflake}
          tint="bg-info/15 text-info"
          title="Streak freeze"
          description="Keep your streak alive on a day off"
        >
          <ComingSoonBadge />
        </ShopItem>
        <ShopItem
          icon={Zap}
          tint="bg-gold/20 text-gold-dark"
          title="Double or nothing"
          description="Wager gems on a seven day streak"
        >
          <ComingSoonBadge />
        </ShopItem>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg">Super</h2>
        <ShopItem
          icon={Sparkles}
          tint="bg-grape/15 text-grape"
          title="Unlock Super"
          description="Unlimited hearts, no ads and personalised practice"
        >
          <ComingSoonBadge />
        </ShopItem>
      </section>
    </div>
  );
}
