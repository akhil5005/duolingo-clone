import clsx from "clsx";

interface LeagueShieldProps {
  size?: number;
  locked?: boolean;
  className?: string;
}

/** Original bronze league badge: a shield with a leaf, drawn as inline SVG. */
export function LeagueShield({ size = 56, locked = false, className }: LeagueShieldProps) {
  const body = locked ? "#D6D6D6" : "#CD7F32";
  const rim = locked ? "#B8B8B8" : "#A2612A";
  const mark = locked ? "#AFAFAF" : "#F4D9BE";

  return (
    <svg
      viewBox="0 0 64 72"
      width={size}
      height={(size / 64) * 72}
      className={clsx(className)}
      aria-hidden
    >
      <path
        d="M32 2 60 11v27c0 16-12 26-28 32C16 64 4 54 4 38V11L32 2Z"
        fill={body}
        stroke={rim}
        strokeWidth={4}
      />
      <path
        d="M32 20c8 4 12 10 12 17 0 6-5 11-12 14-7-3-12-8-12-14 0-7 4-13 12-17Z"
        fill={mark}
      />
      <path d="M32 24v26" stroke={rim} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}
