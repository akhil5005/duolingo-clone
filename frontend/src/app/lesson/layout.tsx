import type { ReactNode } from "react";

import { WakeBanner } from "@/components/layout/WakeBanner";

export default function LessonLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <WakeBanner />
      {children}
    </>
  );
}
