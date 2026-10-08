/**
 * Classic "parliament diagram" hemicycle layout: concentric arcs (rows)
 * spanning 180° above a center point (the dispatch box / podium), with
 * each row holding a seat count proportional to its radius (since arc
 * length scales with radius for a fixed angular span) so dot spacing stays
 * roughly even from row to row.
 *
 * This assigns seats to ROW POSITIONS, not to specific members — the
 * caller decides which member occupies which position (see
 * computeHemicycleSeats). We don't have an official real seating-plan
 * document wired up, so positions are filled in row-major order grouped
 * by party, which is a standard, honest "seats by party" visualization,
 * not a claim about anyone's literal physical seat.
 */
export interface HemicycleSlot {
  x: number;
  y: number;
}

const INNER_RADIUS_FRACTION = 0.42; // of total radius, leaves room for the podium gap
const ROW_COUNT_BASE = 6;

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function computeHemicycleSlots(totalSeats: number, outerRadius: number): HemicycleSlot[] {
  const rows = Math.max(4, Math.round(ROW_COUNT_BASE + Math.sqrt(totalSeats) / 6));
  const innerRadius = outerRadius * INNER_RADIUS_FRACTION;
  const rowGap = (outerRadius - innerRadius) / Math.max(1, rows - 1);
  const rowRadii = Array.from({ length: rows }, (_, i) => innerRadius + i * rowGap);

  const totalRadius = rowRadii.reduce((sum, r) => sum + r, 0);
  const rawCounts = rowRadii.map((r) => (r / totalRadius) * totalSeats);
  const seatsPerRow = largestRemainderRound(rawCounts, totalSeats);

  const slots: HemicycleSlot[] = [];
  rowRadii.forEach((radius, rowIndex) => {
    const count = seatsPerRow[rowIndex];
    for (let seat = 0; seat < count; seat++) {
      const t = count === 1 ? 0.5 : (seat + 0.5) / count;
      const angle = Math.PI - t * Math.PI; // PI (left) -> 0 (right), through PI/2 (top)
      slots.push({ x: round(radius * Math.cos(angle)), y: round(-radius * Math.sin(angle)) });
    }
  });

  return slots;
}

/** Rounds a set of fractional allocations to integers summing exactly to
 * `total`, distributing leftover/shortfall by largest fractional remainder
 * — avoids the "rows don't quite add up to the real seat count" bug a
 * naive Math.round per row would produce. */
function largestRemainderRound(raw: number[], total: number): number[] {
  const floors = raw.map(Math.floor);
  const remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < remainder; k++) result[order[k % order.length].i]++;
  return result;
}
