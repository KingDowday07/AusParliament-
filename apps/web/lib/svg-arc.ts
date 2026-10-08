/** Hand-rolled annular-sector path (no d3 dependency needed for this static
 * first pass — see plan doc's flagged note that d3-force/d3-shape are the
 * recommended upgrade path once the force-directed "Graph" view and
 * rotate/re-center transitions are built). */
export function annularSectorPath(
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const p = (r: number, deg: number) => {
    const rad = toRad(deg);
    return [round(r * Math.cos(rad)), round(r * Math.sin(rad))];
  };
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  const [x1, y1] = p(outerR, startDeg);
  const [x2, y2] = p(outerR, endDeg);
  const [x3, y3] = p(innerR, endDeg);
  const [x4, y4] = p(innerR, startDeg);
  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}
