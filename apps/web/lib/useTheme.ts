"use client";

import { useCallback, useSyncExternalStore } from "react";

const THEME_CHANGE_EVENT = "au-graph-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, callback);
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

// The server has no DOM to check; useSyncExternalStore uses this fixed
// value for SSR and the initial client hydration pass (avoiding a
// hydration mismatch), then switches to the real getSnapshot() value
// immediately after mount — the standard way to read client-only state.
function getServerSnapshot() {
  return true;
}

export function useTheme() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore (private browsing / blocked storage)
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return { isDark, toggle };
}
