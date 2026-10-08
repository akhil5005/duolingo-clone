import clsx from "clsx";

/** Original wordmark for this project - not a Duolingo trademark. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "select-none font-extrabold tracking-tight text-brand",
        className ?? "text-2xl",
      )}
    >
      lingoleap
    </span>
  );
}
