import type { ReactNode } from "react";

import { BottomNav } from "@/components/layout/BottomNav";
import { LeftNav } from "@/components/layout/LeftNav";
import { RightRail } from "@/components/layout/RightRail";
import { TopStatsBar } from "@/components/layout/TopStatsBar";
import { WakeBanner } from "@/components/layout/WakeBanner";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
      <WakeBanner />
      <LeftNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopStatsBar />
        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
          <div className="mx-auto w-full max-w-[600px]">{children}</div>
        </main>
      </div>
      <RightRail />
      <BottomNav />
    </div>
  );
}
