"use client";

import { useMemo, useState } from "react";
import type { Entity, Relationship } from "@au-graph/data-model";
import { computeForceLayout } from "@/lib/force-layout";
import { ENTITY_TYPE_ICON } from "@/lib/entity-icon-map";
import { NodeIcon } from "@/components/powermap/NodeIcon";
import { NodeGradientDefs, nodeGradientUrl } from "@/components/powermap/NodeGradientDefs";

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
      <NodeGradientDefs />
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
              style={{ transition: "opacity 0.35s ease" }}
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
          const scale = isSelected ? 1.25 : isHovered ? 1.15 : 1;
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
              <g
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "center",
                  transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                {(isSelected || isHovered) && (
                  <circle r={size / 2 + 5} fill="none" stroke="#e8c468" strokeWidth={2} />
                )}
                <g style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}>
                  <NodeIcon shape={shape} size={size} color={nodeGradientUrl(node.entity.branch)} />
                </g>
              </g>
              <title>{node.entity.name}</title>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
