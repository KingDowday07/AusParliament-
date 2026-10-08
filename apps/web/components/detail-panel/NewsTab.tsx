import type { NewsItem } from "@au-graph/data-model";

export function NewsTab({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No news on record for this entity yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded border border-panel-border p-3 hover:border-accent"
        >
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>{item.sourceName}</span>
            <span>{item.publishedAt}</span>
          </div>
          <div className="text-sm font-medium">{item.headline}</div>
          <p className="mt-1 text-xs text-foreground/70">{item.bodyMarkdown}</p>
        </a>
      ))}
    </div>
  );
}
