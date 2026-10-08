import clsx from "clsx";

/**
 * "Lingo" - the app's own mascot, drawn from scratch as inline SVG.
 *
 * Deliberately not a copy of any existing mascot: a round green bird with a
 * leaf tuft, an orange beak and five swappable expressions. Inline SVG means no
 * image requests, crisp scaling and expressions that can be driven by state.
 */
export type MascotExpression = "happy" | "sad" | "celebrating" | "thinking" | "sleeping";

const BODY = "#58CC02";
const BODY_DARK = "#4CAF00";
const BELLY = "#89E219";
const TUFT = "#3C9F00";
const BEAK = "#FF9600";
const BEAK_DARK = "#E08500";
const EYE = "#3C3C3C";

const LABELS: Record<MascotExpression, string> = {
  happy: "Lingo the bird, smiling",
  sad: "Lingo the bird, looking sad",
  celebrating: "Lingo the bird, celebrating",
  thinking: "Lingo the bird, thinking",
  sleeping: "Lingo the bird, asleep",
};

interface MascotProps {
  expression?: MascotExpression;
  size?: number;
  className?: string;
  /** Gentle idle bob; turn it off when the mascot sits inside dense layouts. */
  animate?: boolean;
}

function Eye({ cx, lookX, lookY }: { cx: number; lookX: number; lookY: number }) {
  return (
    <g>
      <circle cx={cx} cy={54} r={13} fill="#FFFFFF" />
      <circle cx={cx + lookX} cy={54 + lookY} r={6} fill={EYE} />
      <circle cx={cx + lookX - 2} cy={52 + lookY} r={2} fill="#FFFFFF" />
    </g>
  );
}

function ClosedEyes({ smiling }: { smiling: boolean }) {
  const path = smiling ? "q12 -13 24 0" : "q12 12 24 0";
  return (
    <g stroke={EYE} strokeWidth={5} strokeLinecap="round" fill="none">
      <path d={`M34 56 ${path}`} />
      <path d={`M62 56 ${path}`} />
    </g>
  );
}

function Brows({ expression }: { expression: MascotExpression }) {
  if (expression === "sad") {
    return (
      <g stroke={EYE} strokeWidth={4} strokeLinecap="round">
        <line x1={36} y1={40} x2={54} y2={34} />
        <line x1={66} y1={34} x2={84} y2={40} />
      </g>
    );
  }
  if (expression === "thinking") {
    return (
      <g stroke={EYE} strokeWidth={4} strokeLinecap="round">
        <line x1={36} y1={38} x2={54} y2={38} />
        <line x1={66} y1={30} x2={84} y2={36} />
      </g>
    );
  }
  return null;
}

function Beak({ expression }: { expression: MascotExpression }) {
  if (expression === "celebrating") {
    return (
      <g>
        <path d="M46 70 Q60 63 74 70 Q60 74 46 70 Z" fill={BEAK} />
        <path d="M47 73 Q60 90 73 73 Q60 78 47 73 Z" fill={BEAK_DARK} />
      </g>
    );
  }
  const dip = expression === "sad" ? 4 : 0;
  return (
    <path
      d={`M47 ${71 + dip} Q60 ${64 + dip} 73 ${71 + dip} Q60 ${84 + dip} 47 ${71 + dip} Z`}
      fill={BEAK}
    />
  );
}

export function Mascot({
  expression = "happy",
  size = 96,
  className,
  animate = true,
}: MascotProps) {
  const wingY = expression === "celebrating" ? 54 : 68;
  const look = {
    happy: { x: 1, y: 0 },
    sad: { x: 0, y: 4 },
    celebrating: { x: 0, y: 0 },
    thinking: { x: -4, y: -3 },
    sleeping: { x: 0, y: 0 },
  }[expression];

  return (
    <svg
      role="img"
      aria-label={LABELS[expression]}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={clsx(animate && "animate-bob", className)}
    >
      <ellipse cx={48} cy={106} rx={10} ry={5} fill={BEAK} />
      <ellipse cx={72} cy={106} rx={10} ry={5} fill={BEAK} />
      <path d="M58 26 C51 11 65 3 69 12 C71 19 64 22 63 27 Z" fill={TUFT} />
      <ellipse cx={22} cy={wingY} rx={8} ry={15} fill={BODY_DARK} />
      <ellipse cx={98} cy={wingY} rx={8} ry={15} fill={BODY_DARK} />
      <circle cx={60} cy={62} r={40} fill={BODY} />
      <ellipse cx={60} cy={76} rx={26} ry={22} fill={BELLY} />

      {expression === "celebrating" || expression === "sleeping" ? (
        <ClosedEyes smiling={expression === "celebrating"} />
      ) : (
        <>
          <Eye cx={46} lookX={look.x} lookY={look.y} />
          <Eye cx={74} lookX={look.x} lookY={look.y} />
        </>
      )}
      <Brows expression={expression} />
      <Beak expression={expression} />

      {expression === "sad" && <circle cx={38} cy={72} r={4} fill="#1CB0F6" opacity={0.85} />}
      {expression === "sleeping" && (
        <g fill={EYE} fontSize={16} fontWeight={800}>
          <text x={96} y={34}>
            z
          </text>
          <text x={106} y={20} fontSize={12}>
            z
          </text>
        </g>
      )}
    </svg>
  );
}
