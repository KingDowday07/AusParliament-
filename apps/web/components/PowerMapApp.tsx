"use client";

import { useEffect, useMemo, useState } from "react";
import type { GraphData } from "@au-graph/db";
import { PowerMapCanvas } from "./powermap/PowerMapCanvas";
import { DetailPanel } from "./detail-panel/DetailPanel";
import { LegendPanel } from "./legend/LegendPanel";
import { SearchModal } from "./search/SearchModal";
import { ThemeToggle } from "./ThemeToggle";
import { useNavigationHistory } from "@/lib/useNavigationHistory";

export function PowerMapApp({ data }: { data: GraphData }) {
  const { current: selectedEntityId, navigate, back, forward, canGoBack, canGoForward } =
    useNavigationHistory(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectedEntity = useMemo(
    () => data.entities.find((e) => e.id === selectedEntityId) ?? null,
    [data.entities, selectedEntityId],
  );

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <aside className="w-[420px] shrink-0 border-r border-panel-border bg-panel">
        {selectedEntity ? (
          <DetailPanel data={data} entity={selectedEntity} onSelect={navigate} />
        ) : (
          <div className="flex h-full flex-col gap-3 p-5">
            <div className="text-xs uppercase tracking-wide text-muted">
              CivLab AU (replica) · Core Government
            </div>
            <h1 className="text-xl font-semibold">Australian Commonwealth Power Map</h1>
            <p className="text-sm text-foreground/80">
              Click any node to see its description, legal basis, current officeholder, and relationships.
            </p>
            <p className="text-xs text-muted">
              {data.entities.length} entities · {data.relationships.length} relationships · {data.persons.length}{" "}
              people on record
            </p>
          </div>
        )}
      </aside>

      <main className="relative flex-1">
        <div className="absolute left-4 top-4 z-10">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-72 items-center gap-2 rounded-full border border-panel-border bg-panel px-4 text-sm text-muted hover:border-accent"
          >
            <span aria-hidden>⌕</span>
            Search entities...
            <span className="ml-auto text-xs">⌘K</span>
          </button>
        </div>

        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <button
            onClick={back}
            disabled={!canGoBack}
            aria-label="Back"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-panel-border text-foreground disabled:opacity-30"
          >
            ←
          </button>
          <button
            onClick={forward}
            disabled={!canGoForward}
            aria-label="Forward"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-panel-border text-foreground disabled:opacity-30"
          >
            →
          </button>
          <ThemeToggle />
        </div>

        <div className="absolute bottom-4 left-4 z-10">
          <LegendPanel />
        </div>

        <PowerMapCanvas
          entities={data.entities}
          relationships={data.relationships}
          selectedEntityId={selectedEntityId}
          onSelect={navigate}
        />
      </main>

      <SearchModal entities={data.entities} open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={navigate} />
    </div>
  );
}
