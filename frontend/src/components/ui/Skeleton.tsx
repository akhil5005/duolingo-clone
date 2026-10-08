import clsx from "clsx";
import type { CSSProperties } from "react";

export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={style}
      className={clsx("animate-pulse rounded-2xl bg-line/70", className)}
    />
  );
}
