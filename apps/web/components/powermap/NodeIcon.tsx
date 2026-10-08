import type { IconShape } from "@/lib/entity-icon-map";

export function NodeIcon({ shape, size, color }: { shape: IconShape; size: number; color: string }) {
  const r = size / 2;
  switch (shape) {
    case "seal":
      return <circle r={r} fill={color} stroke="#fff" strokeWidth={2} />;
    case "crown":
    case "vice-crown":
      return (
        <polygon
          points={`0,${-r} ${r * 0.95},${r * 0.6} ${-r * 0.95},${r * 0.6}`}
          fill={color}
          stroke="#fff"
          strokeWidth={1}
        />
      );
    case "council":
      return <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={r * 0.9} fill={color} />;
    case "circle":
      return <circle r={r} fill={color} />;
    case "square":
      return <rect x={-r} y={-r} width={r * 2} height={r * 2} fill={color} />;
    case "hexagon": {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return `${r * Math.cos(a)},${r * Math.sin(a)}`;
      }).join(" ");
      return <polygon points={pts} fill={color} />;
    }
    case "diamond":
      return <polygon points={`0,${-r} ${r},0 0,${r} ${-r},0`} fill={color} />;
    case "badge":
      return <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={r * 0.3} fill={color} />;
    case "gavel":
      return <circle r={r} fill={color} stroke="#fff" strokeWidth={1} strokeDasharray="2 1.5" />;
    default:
      return <circle r={r} fill={color} />;
  }
}
