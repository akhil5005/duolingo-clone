"use client";

import { AnimatePresence, motion } from "framer-motion";

/**
 * The "N in a row" flourish that pops out of the progress bar on a streak.
 *
 * Centring lives on the wrapper because Framer Motion writes its own transform
 * on the animated element, which would cancel a Tailwind -translate-x-1/2.
 */
export function ComboBadge({ combo }: { combo: number | null }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2">
      <AnimatePresence>
        {combo !== null && (
          <motion.span
            key={combo}
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="block whitespace-nowrap rounded-full bg-gold px-3 py-1 text-xs uppercase tracking-wider text-ink shadow-pop"
          >
            {combo} in a row!
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
