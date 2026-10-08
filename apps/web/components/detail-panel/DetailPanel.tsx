import type { Entity } from "@au-graph/data-model";
import type { GraphData } from "@au-graph/db";
import { ENTITY_TYPE_LABEL } from "@/lib/entity-icon-map";
import { getConnectionGroups, getCurrentOfficeholders } from "@/lib/entity-queries";
import { connectionGroupLabel } from "@/lib/relationship-labels";

const MAX_SHOWN_PER_GROUP = 8;

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

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5 text-sm">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        {ENTITY_TYPE_LABEL[entity.type]} · {entity.branch}
      </div>
      <h1 className="text-xl font-semibold leading-snug">{entity.name}</h1>
      <p className="text-neutral-300">{entity.description}</p>
      <div className="flex flex-wrap gap-3 text-xs">
        {entity.legalSourceUrl && (
          <a className="text-amber-400 underline" href={entity.legalSourceUrl} target="_blank" rel="noreferrer">
            Legal source
          </a>
        )}
        {entity.officialWebsiteUrl && (
          <a className="text-amber-400 underline" href={entity.officialWebsiteUrl} target="_blank" rel="noreferrer">
            Official website
          </a>
        )}
      </div>

      {officeholders.length > 0 && (
        <div className="flex flex-col gap-2">
          {officeholders.length > 12 ? (
            <div className="rounded border border-neutral-700 p-3 text-neutral-300">
              {officeholders.filter((o) => o.person).length} of {officeholders.length} seats filled
            </div>
          ) : (
            officeholders.map((o) => (
              <div key={o.seat.id} className="rounded border border-neutral-700 p-3">
                <div className="text-xs text-neutral-500">{o.seat.label}</div>
                {o.person ? (
                  <div className="font-medium">{o.person.name}</div>
                ) : (
                  <div className="italic text-neutral-500">Vacant / not on record</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-neutral-800 pt-4">
        {groups.map((group) => (
          <div key={`${group.type}:${group.direction}`}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-medium">{connectionGroupLabel(group.type, group.direction)}</h2>
              <span className="text-xs text-neutral-500">
                {group.entities.length} {group.entities.length === 1 ? "entity" : "entities"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {group.entities.slice(0, MAX_SHOWN_PER_GROUP).map((e) => (
                <button
                  key={e.id}
                  onClick={() => onSelect(e.id)}
                  className="rounded border border-neutral-800 p-2 text-left text-xs hover:border-amber-400"
                >
                  {e.name}
                </button>
              ))}
            </div>
            {group.entities.length > MAX_SHOWN_PER_GROUP && (
              <div className="mt-1 text-xs text-neutral-500">
                +{group.entities.length - MAX_SHOWN_PER_GROUP} more
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
