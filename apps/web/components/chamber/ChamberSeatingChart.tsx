"use client";

import { useMemo, useState } from "react";
import type { GraphData } from "@au-graph/db";
import { getChamberSeatAssignments, type ChamberSeatAssignment } from "@/lib/chamber-seating";
import { partyColor, partyName } from "@/lib/party-colors";
import { PersonAvatar } from "@/components/PersonAvatar";

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 340;
const OUTER_RADIUS = 300;
const DOT_RADIUS = 7;

export function ChamberSeatingChart({
  data,
  chamberEntityId,
  title,
}: {
  data: GraphData;
  chamberEntityId: string;
  title: string;
}) {
  const assignments = useMemo(
    () => getChamberSeatAssignments(data, chamberEntityId, OUTER_RADIUS),
    [data, chamberEntityId],
  );
  const [selected, setSelected] = useState<ChamberSeatAssignment | null>(null);

  const partyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of assignments) {
      const key = a.party ?? "IND";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [assignments]);

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs text-muted">
          {assignments.filter((a) => a.person).length} of {assignments.length} seats filled
        </span>
      </div>
      <p className="text-xs text-muted">
        Seats grouped by party for readability — not an official seating plan. Click a seat to see who holds it.
      </p>

      <svg
        viewBox={`${-VIEW_WIDTH / 2} ${-VIEW_HEIGHT} ${VIEW_WIDTH} ${VIEW_HEIGHT + 20}`}
        className="w-full"
        role="img"
        aria-label={`${title} seating chart`}
      >
        {assignments.map((a) => {
          const isSelected = selected?.seat.id === a.seat.id;
          return (
            <circle
              key={a.seat.id}
              cx={a.slot.x}
              cy={a.slot.y}
              r={isSelected ? DOT_RADIUS + 2 : DOT_RADIUS}
              fill={partyColor(a.party)}
              stroke={isSelected ? "#e8c468" : "rgba(0,0,0,0.25)"}
              strokeWidth={isSelected ? 2 : 0.75}
              style={{ cursor: "pointer", transition: "r 0.15s ease" }}
              role="button"
              tabIndex={0}
              aria-label={a.person ? `${a.seat.label}: ${a.person.name}` : `${a.seat.label}: vacant`}
              onClick={() => setSelected(a)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(a);
                }
              }}
            >
              <title>{a.person ? `${a.seat.label}: ${a.person.name}` : `${a.seat.label}: vacant`}</title>
            </circle>
          );
        })}
      </svg>

      {selected && (
        <div className="flex items-center gap-3 rounded border border-panel-border p-3">
          {selected.person && <PersonAvatar person={selected.person} size={44} />}
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted">{selected.seat.label}</div>
            {selected.person ? (
              <>
                <div className="truncate font-medium">{selected.person.name}</div>
                <div className="text-xs" style={{ color: partyColor(selected.party) }}>
                  {partyName(selected.party)}
                </div>
              </>
            ) : (
              <div className="italic text-muted">Vacant / not on record</div>
            )}
          </div>
          <button onClick={() => setSelected(null)} className="text-xs text-muted hover:text-foreground">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {partyCounts.map(([code, count]) => (
          <div key={code} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: partyColor(code) }} />
            <span className="text-muted">
              {partyName(code)} ({count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
