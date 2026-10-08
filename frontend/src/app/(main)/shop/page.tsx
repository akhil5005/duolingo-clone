import { Mascot } from "@/components/mascot/Mascot";

export default function ShopPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Mascot expression="thinking" size={120} />
      <h1 className="text-2xl">Shop</h1>
      <p className="max-w-xs text-sm text-muted">This screen is on its way.</p>
    </div>
  );
}
