"use client";

import { PathSkeleton } from "@/components/path/PathSkeleton";
import { PathView } from "@/components/path/PathView";
import { Button3D } from "@/components/ui/Button3D";
import { Mascot } from "@/components/mascot/Mascot";
import { usePath } from "@/hooks/usePath";

export default function LearnPage() {
  const { data, isPending, isError, refetch } = usePath();

  if (isPending) return <PathSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Mascot expression="sad" size={120} />
        <h1 className="text-xl">We could not load your path</h1>
        <p className="max-w-xs text-sm font-semibold text-muted">
          The server may still be waking up. Give it another go.
        </p>
        <Button3D onClick={() => void refetch()}>Try again</Button3D>
      </div>
    );
  }

  return <PathView path={data} />;
}
