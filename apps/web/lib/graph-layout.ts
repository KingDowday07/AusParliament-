import type { Branch, Entity, Relationship } from "@au-graph/data-model";

export interface LayoutNode {
  entity: Entity;
  angleDeg: number; // 0 = top (12 o'clock), increases clockwise
  radius: number; // px from center
  x: number;
  y: number;
}

export interface LayoutEdge {
  relationship: Relationship;
  from: LayoutNode;
  to: LayoutNode;
}

export interface SectorArc {
  branch: Branch;
  startDeg: number;
  endDeg: number;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  nodesById: Map<string, LayoutNode>;
  edges: LayoutEdge[];
  sectors: SectorArc[];
  ringRadii: number[];
}

/** Angular home for each branch sector. Widths sum to 360; order going
 * clockwise from the top is Crown, Legislative, Executive, Judicial —
 * loosely mirroring the reference site's branch wedges, with a 4th "Crown"
 * wedge added for Australia's constitutional-monarchy structure. */
const SECTOR_CONFIG: Record<Branch, { center: number; width: number }> = {
  crown: { center: 0, width: 50 },
  legislative: { center: 70, width: 90 },
  executive: { center: 190, width: 150 },
  judicial: { center: 300, width: 70 },
};

const RING_BASE_RADIUS = 110;
const RING_GAP = 75;
const MAX_RING_LEVEL = 4;

function ringRadiusForLevel(level: number): number {
  return RING_BASE_RADIUS + (level - 1) * RING_GAP;
}

// Rounded to avoid server/client floating-point string serialization
// mismatches (trig results differ in the last ulp across engines), which
// would otherwise trip React's hydration-mismatch check on every node.
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function polarToCartesian(angleDeg: number, radius: number): { x: number; y: number } {
  // angleDeg: 0 = up, clockwise. Convert to standard math radians (0 = right, CCW)
  // then flip y for screen coordinates (SVG y grows downward).
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: round(radius * Math.cos(rad)), y: round(radius * Math.sin(rad)) };
}

export function computeLayout(entities: Entity[], relationships: Relationship[]): LayoutResult {
  const nodesById = new Map<string, LayoutNode>();

  // Group non-root entities by (branch, hierarchyLevel) so siblings can be
  // spread evenly across their sector's angular width.
  const groups = new Map<string, Entity[]>();
  for (const entity of entities) {
    if (entity.hierarchyLevel === 0) continue;
    const key = `${entity.branch}:${entity.hierarchyLevel}`;
    const list = groups.get(key) ?? [];
    list.push(entity);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  const nodes: LayoutNode[] = [];

  for (const entity of entities) {
    if (entity.hierarchyLevel === 0) {
      const node: LayoutNode = { entity, angleDeg: 0, radius: 0, x: 0, y: 0 };
      nodes.push(node);
      nodesById.set(entity.id, node);
      continue;
    }

    const key = `${entity.branch}:${entity.hierarchyLevel}`;
    const siblings = groups.get(key)!;
    const index = siblings.indexOf(entity);
    const { center, width } = SECTOR_CONFIG[entity.branch];

    // Spread siblings evenly across the sector, with ~12% margin on each
    // side so nodes never sit flush against a sector boundary line.
    const margin = width * 0.12;
    const usableWidth = width - margin * 2;
    const sectorStart = center - width / 2 + margin;
    const fraction = siblings.length === 1 ? 0.5 : index / (siblings.length - 1);
    const angleDeg = siblings.length === 1 ? center : sectorStart + fraction * usableWidth;

    const radius = ringRadiusForLevel(Math.min(entity.hierarchyLevel, MAX_RING_LEVEL));
    const { x, y } = polarToCartesian(angleDeg, radius);
    const node: LayoutNode = { entity, angleDeg, radius, x, y };
    nodes.push(node);
    nodesById.set(entity.id, node);
  }

  const edges: LayoutEdge[] = [];
  for (const rel of relationships) {
    const from = nodesById.get(rel.fromEntityId);
    const to = nodesById.get(rel.toEntityId);
    if (from && to) edges.push({ relationship: rel, from, to });
  }

  const sectors: SectorArc[] = (Object.keys(SECTOR_CONFIG) as Branch[]).map((branch) => {
    const { center, width } = SECTOR_CONFIG[branch];
    return { branch, startDeg: center - width / 2, endDeg: center + width / 2 };
  });

  const ringRadii = Array.from({ length: MAX_RING_LEVEL }, (_, i) => ringRadiusForLevel(i + 1));

  return { nodes, nodesById, edges, sectors, ringRadii };
}
