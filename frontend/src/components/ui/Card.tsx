import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={clsx("rounded-2xl border-2 border-line bg-surface", className)}
    >
      {children}
    </div>
  );
}
