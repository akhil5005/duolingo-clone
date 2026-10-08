export const THEME_STORAGE_KEY = "lingoleap-theme";

export type ThemeMode = "light" | "dark";

/**
 * Runs before the first paint, from a blocking inline script.
 *
 * Reading localStorage in an effect would let the light palette flash first on
 * every load, so the class is applied synchronously in <head>. Kept as a string
 * because it has to execute before React hydrates.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", dark);
  } catch (error) {
    /* private mode: fall back to the light palette */
  }
})();
`;

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle("dark", mode === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore: the theme still applies for this session */
  }
}
