/** Colour helpers for unit-tinted path nodes. */

function clamp(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((channel) => clamp(channel).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Darken a colour towards black. Used for the thick bottom border that gives
 * every button and path node its pressable, three-dimensional look - the unit
 * colour comes from the database, so the shadow shade has to be derived.
 */
export function darken(hex: string, ratio = 0.18): string {
  const [r, g, b] = parseHex(hex);
  return toHex([r * (1 - ratio), g * (1 - ratio), b * (1 - ratio)]);
}

/** Same colour at partial opacity, for tinted backgrounds and rings. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
