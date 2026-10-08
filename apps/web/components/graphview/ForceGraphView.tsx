"use client";

import { useMemo, useState } from "react";
import type { Entity, Relationship } from "@au-graph/data-model";
import { computeForceLayout } from "@/lib/force-layout";
import { BRANCH_COLOR, ENTITY_TYPE_ICON } from "@/lib/entity-icon-map";
import { NodeIcon } from "@/components/powermap/NodeIcon";

const VIEW_HALF = 480;

export function ForceGraphView({
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
  const layout = useMemo(() => computeForceLayout(entities, relationships), [entities, relationships]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const focusedId = selectedEntityId ?? hoveredId;

  return (
    <svg
      viewBox={`${-VIEW_HALF} ${-VIEW_HALF} ${VIEW_HALF * 2} ${VIEW_HALF * 2}`}
      className="h-full w-full"
      role="img"
      aria-label="Force-directed graph of the Australian Commonwealth Government"
    >
      <circle r={VIEW_HALF - 5} style={{ fill: "var(--canvas)" }} />

      <g>
        {layout.edges.map((edge) => {
          const isRelated =
            focusedId &&
            (edge.source.entity.id === focusedId || edge.target.entity.id === focusedId);
          return (
            <line
              key={edge.relationship.id}
              x1={edge.source.x}
              y1={edge.source.y}
              x2={edge.target.x}
              y2={edge.target.y}
              stroke={isRelated ? "#e8c468" : "#8b8fa3"}
              strokeWidth={isRelated ? 1.3 : 0.5}
              opacity={focusedId ? (isRelated ? 0.9 : 0.08) : 0.3}
            />
          );
        })}
      </g>

      <g>
        {layout.nodes.map((node) => {
          const shape = ENTITY_TYPE_ICON[node.entity.type];
          const isSelected = node.entity.id === selectedEntityId;
          const isHovered = node.entity.id === hoveredId;
          const size = node.entity.hierarchyLevel === 0 ? 60 : 12;
          return (
            <g
              key={node.entity.id}
              role="button"
              tabIndex={0}
              aria-label={node.entity.name}
              transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}
              onClick={() => onSelect(node.entity.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(node.entity.id);
                }
              }}
              onMouseEnter={() => setHoveredId(node.entity.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(node.entity.id)}
              onBlur={() => setHoveredId(null)}
              style={{ cursor: "pointer", outline: "none" }}
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
    </svg>
  );
}
