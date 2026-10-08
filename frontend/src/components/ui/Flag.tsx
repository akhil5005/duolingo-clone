import clsx from "clsx";

/**
 * Course flags as inline SVG rather than regional-indicator emoji.
 *
 * Windows does not ship colour flag glyphs, so "🇪🇸" renders as the letters
 * "ES" in Chrome there. Drawing the flag keeps the header looking the same on
 * every platform; unknown course codes fall back to the seeded emoji.
 */
const FLAGS: Record<string, React.ReactNode> = {
  es: (
    <>
      <rect width="24" height="16" fill="#AA151B" />
      <rect y="4" width="24" height="8" fill="#F1BF00" />
    </>
  ),
};

interface FlagProps {
  code: string;
  fallback?: string;
  className?: string;
}

export function Flag({ code, fallback, className }: FlagProps) {
  const shape = FLAGS[code.toLowerCase()];

  if (!shape) {
    return (
      <span className={className} aria-hidden>
        {fallback ?? "\u{1F30D}"}
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 24 16"
      className={clsx("rounded-[3px] border border-black/10", className ?? "h-5 w-7")}
      aria-hidden
    >
      {shape}
    </svg>
  );
}
