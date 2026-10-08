/** Builds an SVG path for a polygon with rounded corners, by replacing each
 * vertex with a short quadratic-bezier curve between points pulled back
 * along its adjacent edges. Used to soften hexagons/diamonds/crowns so they
 * read as "friendly" icons rather than sharp geometric shapes. */
export function roundedPolygonPath(points: [number, number][], radius: number): string {
  const n = points.length;
  const d: string[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const toPrev = normalize(curr[0] - prev[0], curr[1] - prev[1]);
    const toNext = normalize(next[0] - curr[0], next[1] - curr[1]);

    const edgeLenPrev = Math.hypot(curr[0] - prev[0], curr[1] - prev[1]);
    const edgeLenNext = Math.hypot(next[0] - curr[0], next[1] - curr[1]);
    const r = Math.min(radius, edgeLenPrev / 2, edgeLenNext / 2);

    const start = [round(curr[0] - toPrev[0] * r), round(curr[1] - toPrev[1] * r)];
    const end = [round(curr[0] + toNext[0] * r), round(curr[1] + toNext[1] * r)];

    d.push(i === 0 ? `M ${start[0]} ${start[1]}` : `L ${start[0]} ${start[1]}`);
    d.push(`Q ${round(curr[0])} ${round(curr[1])} ${end[0]} ${end[1]}`);
  }
  d.push("Z");
  return d.join(" ");
}

function normalize(x: number, y: number): [number, number] {
  const len = Math.hypot(x, y) || 1;
  return [x / len, y / len];
}

// Same server/client float-precision guard as NodeIcon.tsx — see there.
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
