"use client";

import { useEffect, useState } from "react";

import { applyTheme, type ThemeMode } from "@/lib/theme-mode";

/** Reads the theme the inline boot script already applied, and lets it change. */
export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  return {
    mode,
    setMode: (next: ThemeMode) => {
      applyTheme(next);
      setMode(next);
    },
  };
}
