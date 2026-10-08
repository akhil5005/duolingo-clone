import { Skeleton } from "@/components/ui/Skeleton";

/** Mirrors the live path's zig-zag so the layout does not jump when data lands. */
export function PathSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-24 w-full" />
      <div className="flex flex-col items-center gap-14">
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton
            key={index}
            className="h-[70px] w-[70px] rounded-full"
            style={{ position: "relative", left: Math.sin(index * 0.9) * 70 }}
          />
        ))}
      </div>
    </div>
  );
}
