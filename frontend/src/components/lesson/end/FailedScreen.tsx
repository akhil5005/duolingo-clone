"use client";

import { Mascot } from "@/components/mascot/Mascot";
import { Button3D } from "@/components/ui/Button3D";

interface FailedScreenProps {
  title: string;
  description: string;
  onRetry?: () => void;
  onLeave: () => void;
}

export function FailedScreen({ title, description, onRetry, onLeave }: FailedScreenProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <Mascot expression="sad" size={150} />
      <h1 className="text-2xl">{title}</h1>
      <p className="max-w-sm text-sm font-semibold text-muted">{description}</p>
      {onRetry && (
        <Button3D variant="primary" size="lg" onClick={onRetry} className="w-full max-w-md">
          Try again
        </Button3D>
      )}
      <Button3D variant="outline" size="lg" onClick={onLeave} className="w-full max-w-md !text-muted">
        Back to learning
      </Button3D>
    </div>
  );
}
