"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const DISMISS_AFTER_MS = 3000;

type ToastVariant = "success" | "achievement" | "info";

interface ToastInput {
  title: string;
  description?: string;
  icon?: string;
  variant?: ToastVariant;
}

interface Toast extends ToastInput {
  id: number;
}

const VARIANTS: Record<ToastVariant, string> = {
  success: "border-brand bg-brand text-white",
  achievement: "border-gold bg-gold text-ink",
  info: "border-line bg-surface text-ink",
};

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((item) => item.id !== id)),
      DISMISS_AFTER_MS,
    );
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={clsx(
                "flex w-full max-w-sm items-center gap-3 rounded-2xl border-2 px-4 py-3 shadow-pop",
                VARIANTS[toast.variant ?? "info"],
              )}
            >
              {toast.icon && (
                <span className="text-2xl" aria-hidden>
                  {toast.icon}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm">{toast.title}</p>
                {toast.description && (
                  <p className="truncate text-xs font-semibold opacity-90">
                    {toast.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (toast: ToastInput) => void {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside a ToastProvider");
  return show;
}
