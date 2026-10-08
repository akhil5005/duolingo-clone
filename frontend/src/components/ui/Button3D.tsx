"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type Button3DVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "locked"
  | "super"
  | "outline";

export type Button3DSize = "sm" | "md" | "lg";

/**
 * The chunky button the whole app is built from. The "3D" look is a thick
 * bottom border in a darker shade; pressing it shrinks that border and nudges
 * the button down, so the surface appears to sink.
 */
const VARIANTS: Record<Button3DVariant, string> = {
  primary: "bg-brand text-white border-brand-dark hover:brightness-105",
  secondary: "bg-info text-white border-info-dark hover:brightness-105",
  danger: "bg-danger text-white border-danger-dark hover:brightness-105",
  super: "bg-grape text-white border-grape-dark hover:brightness-105",
  outline: "bg-surface text-info border-line border-2 border-b-4 hover:bg-info/5",
  ghost: "bg-transparent text-muted border-transparent hover:bg-ink/5",
  locked: "bg-locked text-locked-ink border-locked cursor-not-allowed",
};

const SIZES: Record<Button3DSize, string> = {
  sm: "px-3 py-2 text-xs rounded-xl",
  md: "px-4 py-3 text-sm rounded-2xl",
  lg: "px-6 py-4 text-base rounded-2xl",
};

interface Button3DProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Button3DVariant;
  size?: Button3DSize;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button3D({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: Button3DProps) {
  const inactive = disabled || variant === "locked";

  return (
    <button
      {...props}
      disabled={inactive}
      className={clsx(
        "inline-flex items-center justify-center gap-2 border-b-4 font-extrabold uppercase tracking-wide transition",
        "select-none active:translate-y-[2px] active:border-b-2",
        SIZES[size],
        VARIANTS[variant],
        fullWidth && "w-full",
        disabled &&
          variant !== "locked" &&
          "cursor-not-allowed border-locked bg-locked text-locked-ink hover:brightness-100",
        inactive && "active:translate-y-0 active:border-b-4",
        className,
      )}
    >
      {children}
    </button>
  );
}
