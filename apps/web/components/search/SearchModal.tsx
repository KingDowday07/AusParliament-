"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import type { Entity } from "@au-graph/data-model";
import { ENTITY_TYPE_ICON, ENTITY_TYPE_LABEL } from "@/lib/entity-icon-map";
import { NodeIcon } from "@/components/powermap/NodeIcon";

export function SearchModal({
  entities,
  open,
  onClose,
  onSelect,
}: {
  entities: Entity[];
  open: boolean;
  onClose: () => void;
  onSelect: (entityId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(
    () => new Fuse(entities, { keys: ["name", "shortName", "portfolio"], threshold: 0.35 }),
    [entities],
  );

  const results = useMemo(() => {
    if (!query.trim()) return entities.slice(0, 8);
    return fuse.search(query, { limit: 8 }).map((r) => r.item);
  }, [query, fuse, entities]);

  // Reset-on-open lives in the close path (below) rather than an effect
  // keyed on `open`, so there's no setState call in an effect body —
  // focusing the input is the only real "external system" side effect.
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const close = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24"
      onClick={close}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-panel-border bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search entities..."
          className="w-full border-b border-panel-border bg-transparent px-4 py-3 text-foreground outline-none"
        />
        <ul className="max-h-96 overflow-y-auto p-2">
          {results.map((entity) => (
            <li key={entity.id}>
              <button
                onClick={() => {
                  onSelect(entity.id);
                  close();
                }}
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-left hover:bg-panel-border"
              >
                <svg width={16} height={16} viewBox="-8 -8 16 16" className="shrink-0">
                  <NodeIcon shape={ENTITY_TYPE_ICON[entity.type]} size={10} color="var(--accent)" />
                </svg>
                <span className="flex-1 truncate">{entity.name}</span>
                <span className="shrink-0 text-xs text-muted">{ENTITY_TYPE_LABEL[entity.type]}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">No matches</li>}
        </ul>
      </div>
    </div>
  );
}
