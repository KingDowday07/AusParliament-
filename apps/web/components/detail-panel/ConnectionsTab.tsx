import type { ConnectionGroup } from "@/lib/entity-queries";
import { connectionGroupLabel } from "@/lib/relationship-labels";

const MAX_SHOWN_PER_GROUP = 8;

export function ConnectionsTab({
  groups,
  onSelect,
}: {
  groups: ConnectionGroup[];
  onSelect: (entityId: string) => void;
}) {
  if (groups.length === 0) {
    return <p className="text-sm text-muted">No recorded relationships for this entity yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={`${group.type}:${group.direction}`}>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-medium">{connectionGroupLabel(group.type, group.direction)}</h2>
            <span className="text-xs text-muted">
              {group.entities.length} {group.entities.length === 1 ? "entity" : "entities"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {group.entities.slice(0, MAX_SHOWN_PER_GROUP).map((e) => (
              <button
                key={e.id}
                onClick={() => onSelect(e.id)}
                className="rounded border border-panel-border p-2 text-left text-xs hover:border-accent"
              >
                {e.name}
              </button>
            ))}
          </div>
          {group.entities.length > MAX_SHOWN_PER_GROUP && (
            <div className="mt-1 text-xs text-muted">+{group.entities.length - MAX_SHOWN_PER_GROUP} more</div>
          )}
        </div>
      ))}
    </div>
  );
}
