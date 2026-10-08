"use client";

import { useState } from "react";
import { LEGEND_ENTITY_TYPES, LEGEND_RELATIONSHIP_TYPES, ENTITY_TYPE_ICON } from "@/lib/legend-config";
import { NodeIcon } from "@/components/powermap/NodeIcon";

export function LegendPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="rounded-full border border-panel-border bg-panel px-4 py-2 text-sm text-foreground hover:border-accent"
      >
        Legend {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="absolute bottom-12 left-0 z-10 max-h-[60vh] w-72 overflow-y-auto rounded-lg border border-panel-border bg-panel p-4 text-sm shadow-xl">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Entities</div>
          <ul className="mb-4 flex flex-col gap-1.5">
            {LEGEND_ENTITY_TYPES.map(({ type, label }) => (
              <li key={type} className="flex items-center gap-2">
                <svg width={16} height={16} viewBox="-8 -8 16 16">
                  <NodeIcon shape={ENTITY_TYPE_ICON[type]} size={10} color="var(--accent)" />
                </svg>
                {label}
              </li>
            ))}
          </ul>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Relationships</div>
          <ul className="flex flex-col gap-1.5">
            {LEGEND_RELATIONSHIP_TYPES.map(({ type, label, dash }) => (
              <li key={type} className="flex items-center gap-2">
                <svg width={24} height={10}>
                  <line x1={0} y1={5} x2={24} y2={5} stroke="var(--muted)" strokeWidth={1.5} strokeDasharray={dash} />
                </svg>
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
