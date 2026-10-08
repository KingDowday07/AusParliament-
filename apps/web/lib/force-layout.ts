import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from "d3-force";
import type { Entity, Relationship } from "@au-graph/data-model";

export interface ForceNode extends SimulationNodeDatum {
  entity: Entity;
}

export interface ForceEdge {
  relationship: Relationship;
  source: ForceNode;
  target: ForceNode;
}

export interface ForceLayoutResult {
  nodes: ForceNode[];
  edges: ForceEdge[];
}

// Static layout: the simulation is run to near-equilibrium up front rather
// than animated live, which keeps this a plain render instead of a
// requestAnimationFrame loop — the pragmatic v1 scope per the plan (full
// interactive physics was flagged as an upgrade-if-needed, not a v1
// requirement).
const SETTLE_TICKS = 300;

export function computeForceLayout(entities: Entity[], relationships: Relationship[]): ForceLayoutResult {
  const nodes: ForceNode[] = entities.map((entity) => ({ entity }));
  const nodesById = new Map(nodes.map((n) => [n.entity.id, n]));

  const links = relationships
    .filter((r) => nodesById.has(r.fromEntityId) && nodesById.has(r.toEntityId))
    .map((r) => ({
      relationship: r,
      source: nodesById.get(r.fromEntityId)!,
      target: nodesById.get(r.toEntityId)!,
    }));

  forceSimulation(nodes)
    .force(
      "link",
      forceLink(links)
        .id((d) => (d as ForceNode).entity.id)
        .distance(55)
        .strength(0.25),
    )
    .force("charge", forceManyBody().strength(-110))
    .force("center", forceCenter(0, 0))
    .force(
      "collide",
      forceCollide<ForceNode>().radius((d) => (d.entity.hierarchyLevel === 0 ? 36 : 12)),
    )
    .stop()
    .tick(SETTLE_TICKS);

  return { nodes, edges: links };
}
