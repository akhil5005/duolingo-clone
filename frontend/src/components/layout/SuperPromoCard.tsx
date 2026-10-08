import Link from "next/link";

import { Button3D } from "@/components/ui/Button3D";
import { Card } from "@/components/ui/Card";

export function SuperPromoCard() {
  return (
    <Card className="border-grape/40 bg-grape/10 p-4">
      <h2 className="mb-1 text-base text-grape-dark">Unlock Super</h2>
      <p className="mb-3 text-xs font-semibold text-muted">
        Unlimited hearts, no ads and personalised practice.
      </p>
      <Link href="/shop">
        <Button3D variant="super" size="sm" fullWidth>
          Learn more
        </Button3D>
      </Link>
    </Card>
  );
}
