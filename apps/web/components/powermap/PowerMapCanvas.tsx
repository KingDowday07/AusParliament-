"use client";

import { useMemo, useState } from "react";
import type { Entity, Relationship } from "@au-graph/data-model";
import { computeLayout } from "@/lib/graph-layout";
import { annularSectorPath } from "@/lib/svg-arc";
import { BRANCH_COLOR, ENTITY_TYPE_ICON, RELATIONSHIP_STYLE } from "@/lib/entity-icon-map";
import { NodeIcon } from "./NodeIcon";
import { NodeGradientDefs, nodeGradientUrl } from "./NodeGradientDefs";

const VIEW_HALF = 480;
const SECTOR_OUTER_RADIUS = 440;

export function PowerMapCanvas({
  entities,
  relationships,
  selectedEntityId,
  onSelect,
  onSectorClick,
}: {
  entities: Entity[];
  relationships: Relationship[];
  selectedEntityId: string | null;
  onSelect: (entityId: string) => void;
  onSectorClick?: (branch: string) => void;
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
      <NodeGradientDefs />
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
              style={{ transition: "opacity 0.35s ease, stroke-width 0.35s ease" }}
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
          const scale = isSelected ? 1.25 : isHovered ? 1.15 : 1;
          return (
            <g
              key={node.entity.id}
              role="button"
              tabIndex={0}
              aria-label={node.entity.name}
              transform={`translate(${node.x}, ${node.y})`}
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
                  <circle
                    r={size / 2 + 5}
                    fill="none"
                    stroke="#e8c468"
                    strokeWidth={2}
                    style={{ transition: "opacity 0.25s ease" }}
                  />
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

      {/* Sector labels */}
      {layout.sectors.map((sector) => {
        const mid = (sector.startDeg + sector.endDeg) / 2;
        const rad = ((mid - 90) * Math.PI) / 180;
        const labelR = SECTOR_OUTER_RADIUS + 20;
        const x = labelR * Math.cos(rad);
        const y = labelR * Math.sin(rad);
        const clickable = sector.branch === "legislative" && onSectorClick;
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
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            style={clickable ? { cursor: "pointer", textDecoration: "underline" } : undefined}
            onClick={clickable ? () => onSectorClick(sector.branch) : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSectorClick(sector.branch);
                    }
                  }
                : undefined
            }
          >
            {sector.branch.toUpperCase()}
            {clickable ? " ⊕" : ""}
          </text>
        );
      })}
    </svg>
  );
}
