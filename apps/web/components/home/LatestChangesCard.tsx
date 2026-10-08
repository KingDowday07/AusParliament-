"use client";

import { useMemo, useState } from "react";
import type { GraphData } from "@au-graph/db";
import { getChangeFeed, getLastChangeDaysAgo, getSeatsVacantCount } from "@/lib/change-feed";

const WINDOWS = [7, 30, 90] as const;

export function LatestChangesCard({
  data,
  onSelect,
}: {
  data: GraphData;
  onSelect: (entityId: string) => void;
}) {
  const [windowDays, setWindowDays] = useState<(typeof WINDOWS)[number]>(90);

  const feed = useMemo(() => getChangeFeed(data, windowDays), [data, windowDays]);
  const seatsVacant = useMemo(() => getSeatsVacantCount(data), [data]);
  const lastChangeDaysAgo = useMemo(() => getLastChangeDaysAgo(data), [data]);

  return (
    <div className="flex flex-col gap-3 border-t border-panel-border pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Latest Changes</h2>
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setWindowDays(w)}
              className={`rounded-full px-2 py-0.5 text-xs ${
                windowDays === w ? "bg-accent text-black" : "border border-panel-border text-muted"
              }`}
            >
              {w}D
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted">
        Structural changes are diffed from official sources (see packages/monitor); the live scheduled pipeline
        isn&apos;t connected yet, so this reflects what&apos;s been manually researched so far.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border border-panel-border p-3">
          <div className="text-xs uppercase tracking-wide text-muted">Seats Vacant</div>
          <div className="text-lg font-semibold">{seatsVacant}</div>
          <div className="text-xs text-muted">no current officeholder</div>
        </div>
        <div className="rounded border border-panel-border p-3">
          <div className="text-xs uppercase tracking-wide text-muted">Last Change</div>
          <div className="text-lg font-semibold">
            {lastChangeDaysAgo === null ? "—" : `${lastChangeDaysAgo}d`}
          </div>
          <div className="text-xs text-muted">ago</div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {feed.length === 0 && (
          <p className="text-xs text-muted">No recorded changes in the last {windowDays} days.</p>
        )}
        {feed.map((entry) => (
          <button
            key={entry.term.id}
            onClick={() => onSelect(entry.entityId)}
            className="rounded border border-panel-border p-3 text-left hover:border-accent"
          >
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span className="rounded bg-panel-border px-1.5 py-0.5 uppercase tracking-wide">Appointed</span>
              <span>{entry.daysAgo}d ago</span>
            </div>
            <div className="text-sm font-medium">
              {entry.seatLabel} · {entry.entityName}
            </div>
            <div className="mt-1 flex items-center gap-4 text-xs">
              <span className="text-muted">
                OUT:{" "}
                {entry.term.predecessorTermId === null ? (
                  <em>Predecessor not on record</em>
                ) : (
                  entry.term.predecessorTermId
                )}
              </span>
              <span>IN: {entry.personName ?? "Unknown"}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
