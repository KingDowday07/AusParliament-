import type { IconShape } from "@/lib/entity-icon-map";
import { roundedPolygonPath } from "@/lib/rounded-polygon";

// Rounded to avoid server/client floating-point string serialization
// mismatches (trig results differ in the last ulp across engines), which
// otherwise trips React's hydration-mismatch check — see graph-layout.ts
// for the same fix applied to node positions.
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function hexPoints(r: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return [round(r * Math.cos(a)), round(r * Math.sin(a))] as [number, number];
  });
}

export function NodeIcon({ shape, size, color }: { shape: IconShape; size: number; color: string }) {
  const r = size / 2;
  const fill = color.startsWith("url(") ? color : color;

  switch (shape) {
    case "seal":
      return (
        <g>
          <circle r={r} fill={fill} />
          <circle r={r} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.5} />
          <circle r={r * 0.78} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1} />
          {/* scalloped ring, evoking a wax-seal / official badge edge */}
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={round(Math.cos(a) * r * 0.93)}
                cy={round(Math.sin(a) * r * 0.93)}
                r={r * 0.09}
                fill="#fff"
                fillOpacity={0.25}
              />
            );
          })}
        </g>
      );

    case "crown":
    case "vice-crown": {
      const base = r * 0.55;
      const path = `M ${-r} ${base} L ${-r} ${base * 0.3} L ${-r * 0.55} ${-r * 0.1} L ${-r * 0.22} ${base * 0.3} L 0 ${-r} L ${r * 0.22} ${base * 0.3} L ${r * 0.55} ${-r * 0.1} L ${r} ${base * 0.3} L ${r} ${base} Z`;
      return (
        <g>
          <path d={path} fill={fill} stroke="#fff" strokeWidth={0.75} strokeLinejoin="round" />
          <circle cx={0} cy={-r} r={r * 0.12} fill="#fff" fillOpacity={0.8} />
          <circle cx={-r * 0.55} cy={-r * 0.1} r={r * 0.09} fill="#fff" fillOpacity={0.6} />
          <circle cx={r * 0.55} cy={-r * 0.1} r={r * 0.09} fill="#fff" fillOpacity={0.6} />
        </g>
      );
    }

    case "council":
      return <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={r * 0.9} fill={fill} />;

    case "circle":
      return <circle r={r} fill={fill} />;

    case "square":
      return <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={r * 0.22} fill={fill} />;

    case "hexagon":
      return <path d={roundedPolygonPath(hexPoints(r), r * 0.22)} fill={fill} strokeLinejoin="round" />;

    case "diamond":
      return (
        <path
          d={roundedPolygonPath(
            [
              [0, -r],
              [r, 0],
              [0, r],
              [-r, 0],
            ],
            r * 0.2,
          )}
          fill={fill}
        />
      );

    case "badge":
      return <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={r * 0.35} fill={fill} />;

    case "gavel": {
      const headW = r * 1.3;
      const headH = r * 0.6;
      return (
        <g transform="rotate(-40)">
          <rect x={-headW / 2} y={-headH / 2} width={headW} height={headH} rx={r * 0.15} fill={fill} />
          <rect x={-r * 0.12} y={headH / 2 - r * 0.05} width={r * 0.24} height={r * 1.1} rx={r * 0.1} fill={fill} />
        </g>
      );
    }

    default:
      return <circle r={r} fill={fill} />;
  }
}
