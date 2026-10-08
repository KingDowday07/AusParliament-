"use client";

import { useState } from "react";
import type { Entity } from "@au-graph/data-model";
import type { GraphData } from "@au-graph/db";
import { ENTITY_TYPE_LABEL } from "@/lib/entity-icon-map";
import { getConnectionGroups, getCurrentOfficeholders, getNewsForEntity } from "@/lib/entity-queries";
import { NewsTab } from "./NewsTab";
import { ConnectionsTab } from "./ConnectionsTab";

type Tab = "news" | "connections";

export function DetailPanel({
  data,
  entity,
  onSelect,
}: {
  data: GraphData;
  entity: Entity;
  onSelect: (entityId: string) => void;
}) {
  const officeholders = getCurrentOfficeholders(data, entity.id);
  const groups = getConnectionGroups(data, entity.id);
  const news = getNewsForEntity(data, entity.id);
  const [tab, setTab] = useState<Tab>(news.length > 0 ? "news" : "connections");

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5 text-sm">
      <div className="text-xs uppercase tracking-wide text-muted">
        {ENTITY_TYPE_LABEL[entity.type]} · {entity.branch}
      </div>
      <h1 className="text-xl font-semibold leading-snug">{entity.name}</h1>
      <p className="text-foreground/80">{entity.description}</p>
      <div className="flex flex-wrap gap-3 text-xs">
        {entity.legalSourceUrl && (
          <a className="text-accent underline" href={entity.legalSourceUrl} target="_blank" rel="noreferrer">
            Legal source
          </a>
        )}
        {entity.officialWebsiteUrl && (
          <a className="text-accent underline" href={entity.officialWebsiteUrl} target="_blank" rel="noreferrer">
            Official website
          </a>
        )}
      </div>

      {officeholders.length > 0 && (
        <div className="flex flex-col gap-2">
          {officeholders.length > 12 ? (
            <div className="rounded border border-panel-border p-3 text-foreground/80">
              {officeholders.filter((o) => o.person).length} of {officeholders.length} seats filled
            </div>
          ) : (
            officeholders.map((o) => (
              <div key={o.seat.id} className="rounded border border-panel-border p-3">
                <div className="text-xs text-muted">{o.seat.label}</div>
                {o.person ? (
                  <div className="font-medium">{o.person.name}</div>
                ) : (
                  <div className="italic text-muted">Vacant / not on record</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex border-b border-panel-border text-sm">
        <button
          onClick={() => setTab("news")}
          className={`px-4 py-2 ${tab === "news" ? "border-b-2 border-accent font-medium" : "text-muted"}`}
        >
          News
        </button>
        <button
          onClick={() => setTab("connections")}
          className={`px-4 py-2 ${tab === "connections" ? "border-b-2 border-accent font-medium" : "text-muted"}`}
        >
          Who&apos;s connected?
        </button>
      </div>

      {tab === "news" ? <NewsTab items={news} /> : <ConnectionsTab groups={groups} onSelect={onSelect} />}
    </div>
  );
}
