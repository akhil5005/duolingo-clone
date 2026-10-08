"use client";

import { motion } from "framer-motion";

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
}

/** The crown-progress ring drawn around the node the learner is currently on. */
export function ProgressRing({
  value,
  size = 90,
  stroke = 7,
  color = "#FFC800",
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(1, Math.max(0, value));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgb(var(--line))"
        strokeWidth={stroke}
      />
      {/* Rotated here so the arc starts at twelve o'clock; framer-motion owns
          the `transform` prop on the circle itself. */}
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </g>
    </svg>
  );
}
