"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Border and arrow colour; defaults to the neutral card border. */
  accent?: string;
  align?: "center" | "right";
}

/**
 * A small panel anchored under its trigger.
 *
 * Positioning is plain CSS against a `relative` parent rather than a floating
 * library: every popover in this app hangs directly below its trigger, so the
 * extra dependency would not earn its weight. A transparent full-screen button
 * sits behind the panel to catch outside clicks.
 */
export function Popover({
  open,
  onClose,
  children,
  className,
  accent,
  align = "center",
}: PopoverProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="fixed inset-0 z-30 cursor-default"
          />
          {/* Positioning lives on this wrapper: framer-motion writes its own
              `transform` on the animated element, which would cancel out a
              Tailwind `-translate-x-1/2` used for centring. */}
          <div
            className={clsx(
              "absolute top-full z-40 mt-4",
              align === "center" ? "left-1/2 -translate-x-1/2" : "right-0",
            )}
          >
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={accent ? { borderColor: accent } : undefined}
              className={clsx(
                "relative w-64 rounded-2xl border-2 border-line bg-surface p-4 shadow-pop",
                className,
              )}
            >
              <span
                style={accent ? { borderColor: accent } : undefined}
                className={clsx(
                  "absolute -top-[9px] h-4 w-4 rotate-45 border-l-2 border-t-2 border-line bg-surface",
                  align === "center" ? "left-1/2 -ml-2" : "right-6",
                )}
              />
              <div className="relative">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
