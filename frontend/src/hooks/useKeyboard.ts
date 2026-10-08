"use client";

import { useEffect } from "react";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
  );
}

/** Run `handler` when `key` is pressed, unless the learner is typing an answer. */
export function useKeyPress(
  key: string,
  handler: () => void,
  { enabled = true, allowWhileTyping = false }: { enabled?: boolean; allowWhileTyping?: boolean } = {},
): void {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key) return;
      if (!allowWhileTyping && isTypingTarget(event.target)) return;
      event.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, handler, enabled, allowWhileTyping]);
}

/** Number keys 1-9 pick the nth option, the way Duolingo's shortcuts work. */
export function useNumberKeys(
  handler: (index: number) => void,
  { enabled = true, count = 9 }: { enabled?: boolean; count?: number } = {},
): void {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const index = Number(event.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= count) return;
      event.preventDefault();
      handler(index);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handler, enabled, count]);
}
