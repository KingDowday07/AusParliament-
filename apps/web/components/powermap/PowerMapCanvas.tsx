"use client";

import { useMemo, useState } from "react";
import type { Entity, Relationship } from "@au-graph/data-model";
import { computeLayout } from "@/lib/graph-layout";
import { annularSectorPath } from "@/lib/svg-arc";
import { BRANCH_COLOR, ENTITY_TYPE_ICON, RELATIONSHIP_STYLE } from "@/lib/entity-icon-map";
import { NodeIcon } from "./NodeIcon";

const VIEW_HALF = 480;
const SECTOR_OUTER_RADIUS = 440;

export function PowerMapCanvas({
  entities,
  relationships,
  selectedEntityId,
  onSelect,
}: {
  entities: Entity[];
  relationships: Relationship[];
  selectedEntityId: string | null;
  onSelect: (entityId: string) => void;
}) {
  const layout = useMemo(() => computeLayout(entities, relationships), [entities, relationships]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const focusedId = selectedEntityId ?? hoveredId;
  const relatedEdgeIds = useMemo(() => {
    if (!focusedId) return null;
    const set = new Set<string>();
    for (const edge of layout.edges) {
      if (edge.from.entity.id === focusedId || edge.to.entity.id === focusedId) {
        set.add(edge.relationship.id);
      }
    }
    return set;
  }, [focusedId, layout.edges]);

  return (
    <svg
      viewBox={`${-VIEW_HALF} ${-VIEW_HALF} ${VIEW_HALF * 2} ${VIEW_HALF * 2}`}
      className="h-full w-full"
      role="img"
      aria-label="Power map of the Australian Commonwealth Government"
    >
      <circle r={VIEW_HALF - 5} style={{ fill: "var(--canvas)" }} />

      {/* Branch sector backgrounds */}
      {layout.sectors.map((sector) => (
        <path
          key={sector.branch}
          d={annularSectorPath(40, SECTOR_OUTER_RADIUS, sector.startDeg, sector.endDeg)}
          fill={BRANCH_COLOR[sector.branch]}
          opacity={0.12}
        />
      ))}

      {/* Ring guide circles */}
      {layout.ringRadii.map((r) => (
        <circle key={r} r={r} fill="none" style={{ stroke: "var(--ring-line)" }} />
      ))}

      {/* Edges */}
      <g>
        {layout.edges.map((edge) => {
          const style = RELATIONSHIP_STYLE[edge.relationship.type];
          const isRelated = relatedEdgeIds?.has(edge.relationship.id);
          const dimmed = relatedEdgeIds !== null && !isRelated;
          return (
            <line
              key={edge.relationship.id}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              stroke={isRelated ? "#e8c468" : "#8b8fa3"}
              strokeWidth={isRelated ? 1.5 : 0.6}
              strokeDasharray={style.dash}
              opacity={dimmed ? 0.08 : isRelated ? 0.9 : 0.35}
            />
          );
        })}
      </g>

      {/* Nodes */}
      <g>
        {layout.nodes.map((node) => {
          const shape = ENTITY_TYPE_ICON[node.entity.type];
          const isSelected = node.entity.id === selectedEntityId;
          const isHovered = node.entity.id === hoveredId;
          const size = node.entity.hierarchyLevel === 0 ? 70 : node.entity.hierarchyLevel <= 2 ? 22 : 14;
          return (
            <g
              key={node.entity.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => onSelect(node.entity.id)}
              onMouseEnter={() => setHoveredId(node.entity.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: "pointer" }}
            >
              {(isSelected || isHovered) && (
                <circle r={size / 2 + 5} fill="none" stroke="#e8c468" strokeWidth={2} />
              )}
              <NodeIcon shape={shape} size={size} color={BRANCH_COLOR[node.entity.branch]} />
              <title>{node.entity.name}</title>
            </g>
          );
        })}
      </g>

      {/* Sector labels */}
      {layout.sectors.map((sector) => {
        const mid = (sector.startDeg + sector.endDeg) / 2;
        const rad = ((mid - 90) * Math.PI) / 180;
        const labelR = SECTOR_OUTER_RADIUS + 20;
        const x = labelR * Math.cos(rad);
        const y = labelR * Math.sin(rad);
        return (
          <text
            key={sector.branch}
            x={x}
            y={y}
            fill={BRANCH_COLOR[sector.branch]}
            fontSize={13}
            fontWeight={600}
            letterSpacing={2}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {sector.branch.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}
