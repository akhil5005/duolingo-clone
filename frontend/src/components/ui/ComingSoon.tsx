import Link from "next/link";

import { Mascot } from "@/components/mascot/Mascot";
import { Button3D } from "@/components/ui/Button3D";

interface ComingSoonProps {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}

export function ComingSoon({
  title,
  description,
  backHref = "/learn",
  backLabel = "Back to learning",
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center gap-5 py-14 text-center">
      <Mascot expression="thinking" size={132} />
      <h1 className="text-2xl">{title}</h1>
      <p className="max-w-sm text-sm font-semibold text-muted">{description}</p>
      <Link href={backHref}>
        <Button3D variant="primary" size="md">
          {backLabel}
        </Button3D>
      </Link>
    </div>
  );
}
