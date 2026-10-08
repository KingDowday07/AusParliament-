"use client";

import { useTheme } from "@/lib/useTheme";

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-panel-border text-foreground hover:border-accent"
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
}
