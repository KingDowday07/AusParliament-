import type { GraphData } from "@au-graph/db";
import { getLatestNews } from "@/lib/entity-queries";

export function LatestNewsCard({
  data,
  onSelect,
}: {
  data: GraphData;
  onSelect: (entityId: string) => void;
}) {
  const items = getLatestNews(data, 5);
  if (items.length === 0) return null;

  const entitiesById = new Map(data.entities.map((e) => [e.id, e]));

  return (
    <div className="flex flex-col gap-3 border-t border-panel-border pt-4">
      <h2 className="text-sm font-semibold">Latest News</h2>
      {items.map((item) => (
        <div key={item.id} className="rounded border border-panel-border p-3">
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>{item.sourceName}</span>
            <span>{item.publishedAt}</span>
          </div>
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline">
            {item.headline}
          </a>
          <p className="mt-1 text-xs text-foreground/70">{item.bodyMarkdown}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.relatedEntityIds.map((id) => {
              const entity = entitiesById.get(id);
              if (!entity) return null;
              return (
                <button
                  key={id}
                  onClick={() => onSelect(id)}
                  className="rounded-full border border-panel-border px-2 py-0.5 text-xs hover:border-accent"
                >
                  {entity.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
