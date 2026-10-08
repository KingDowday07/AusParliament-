"use client";

import { useMemo, useState } from "react";
import type { GraphData } from "@au-graph/db";
import { PowerMapCanvas } from "./powermap/PowerMapCanvas";
import { DetailPanel } from "./detail-panel/DetailPanel";

export function PowerMapApp({ data }: { data: GraphData }) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const selectedEntity = useMemo(
    () => data.entities.find((e) => e.id === selectedEntityId) ?? null,
    [data.entities, selectedEntityId],
  );

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      <aside className="w-[420px] shrink-0 border-r border-neutral-800">
        {selectedEntity ? (
          <DetailPanel data={data} entity={selectedEntity} onSelect={setSelectedEntityId} />
        ) : (
          <div className="flex h-full flex-col gap-3 p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">CivLab AU (replica) · Core Government</div>
            <h1 className="text-xl font-semibold">Australian Commonwealth Power Map</h1>
            <p className="text-sm text-neutral-300">
              Click any node to see its description, legal basis, current officeholder, and relationships.
            </p>
            <p className="text-xs text-neutral-500">
              {data.entities.length} entities · {data.relationships.length} relationships · {data.persons.length}{" "}
              people on record
            </p>
          </div>
        )}
      </aside>
      <main className="relative flex-1">
        <PowerMapCanvas
          entities={data.entities}
          relationships={data.relationships}
          selectedEntityId={selectedEntityId}
          onSelect={setSelectedEntityId}
        />
      </main>
    </div>
  );
}
