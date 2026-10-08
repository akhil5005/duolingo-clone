/** Decorative treasure chest that breaks up the path between skills. */
export function ChestNode() {
  return (
    <svg viewBox="0 0 72 60" width={64} height={54} aria-hidden>
      <path d="M6 26c0-9 13-16 30-16s30 7 30 16Z" fill="#FFC800" stroke="#C98A2E" strokeWidth={3} />
      <rect x={6} y={26} width={60} height={26} rx={5} fill="#E0A94A" stroke="#C98A2E" strokeWidth={3} />
      <rect x={6} y={30} width={60} height={6} fill="#C98A2E" />
      <rect x={29} y={22} width={14} height={20} rx={3} fill="#FFE27A" stroke="#C98A2E" strokeWidth={2} />
      <circle cx={36} cy={33} r={2.5} fill="#C98A2E" />
      <rect x={2} y={50} width={68} height={7} rx={3.5} fill="#A86F1F" />
    </svg>
  );
}
