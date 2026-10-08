import type { Person } from "@au-graph/data-model";

const AVATAR_PALETTE = ["#a4760a", "#8a8540", "#6b7280", "#b8463d", "#3f6b6d", "#7a5a9c"];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function PersonAvatar({ person, size = 40 }: { person: Person; size?: number }) {
  if (person.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Wikimedia thumbnails, not worth Next/Image's remote-pattern config for this
      <img
        src={person.photoUrl}
        alt={person.name}
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-panel-border object-cover"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-panel-border font-medium text-white"
      style={{ width: size, height: size, backgroundColor: colorForName(person.name), fontSize: size * 0.4 }}
      aria-label={person.name}
    >
      {initials(person.name)}
    </div>
  );
}
