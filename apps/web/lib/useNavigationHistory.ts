"use client";

import { useCallback, useMemo, useState } from "react";

/** A small in-app back/forward history, scoped to entity selection rather
 * than full browser history (per the plan: "independent of full browser
 * history" since there's no per-entity route yet). Visiting a new entity
 * truncates any forward history, like normal browser navigation. */
export function useNavigationHistory(initial: string | null = null) {
  const [state, setState] = useState<{ stack: (string | null)[]; index: number }>({
    stack: [initial],
    index: 0,
  });

  const navigate = useCallback((entityId: string | null) => {
    setState((prev) => {
      if (prev.stack[prev.index] === entityId) return prev;
      const truncated = prev.stack.slice(0, prev.index + 1);
      return { stack: [...truncated, entityId], index: truncated.length };
    });
  }, []);

  const back = useCallback(() => {
    setState((prev) => ({ ...prev, index: Math.max(0, prev.index - 1) }));
  }, []);

  const forward = useCallback(() => {
    setState((prev) => ({ ...prev, index: Math.min(prev.stack.length - 1, prev.index + 1) }));
  }, []);

  return useMemo(
    () => ({
      current: state.stack[state.index],
      navigate,
      back,
      forward,
      canGoBack: state.index > 0,
      canGoForward: state.index < state.stack.length - 1,
    }),
    [state, navigate, back, forward],
  );
}
