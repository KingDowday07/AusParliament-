/** Real Australian party brand colors for the chamber seating charts.
 * Covers every code present in the live APH data as of this dataset; any
 * future/unlisted code falls back to a deterministic hash color rather
 * than a hardcoded "unknown" gray, so a new minor party still reads as its
 * own distinct color instead of blending into independents. */
export const PARTY_COLORS: Record<string, string> = {
  ALP: "#E4002B", // Labor
  LP: "#1C4F9C", // Liberal
  LNP: "#0C3C78", // Liberal National (Qld)
  NATS: "#09753A", // The Nationals
  AG: "#39B54A", // Australian Greens
  ON: "#F57921", // One Nation
  PHON: "#F57921",
  UAP: "#FFC20E", // United Australia Party
  IND: "#9CA3AF", // Independent
  JLN: "#6A4C93", // Jacqui Lambie Network
  CLP: "#1C4F9C", // Country Liberal (NT) — Coalition-aligned, Liberal blue
  AV: "#D6336C", // Australia's Voice
  KAP: "#7A1F2B", // Katter's Australian Party
  CA: "#00A99D", // Centre Alliance
};

export const PARTY_NAMES: Record<string, string> = {
  ALP: "Labor",
  LP: "Liberal",
  LNP: "Liberal National",
  NATS: "The Nationals",
  AG: "Greens",
  ON: "One Nation",
  PHON: "One Nation",
  UAP: "United Australia Party",
  IND: "Independent",
  JLN: "Jacqui Lambie Network",
  CLP: "Country Liberal",
  AV: "Australia's Voice",
  KAP: "Katter's Australian Party",
  CA: "Centre Alliance",
};

function hashColor(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  return `hsl(${hash % 360}, 55%, 50%)`;
}

export function partyColor(code: string | undefined): string {
  if (!code) return PARTY_COLORS.IND;
  return PARTY_COLORS[code] ?? hashColor(code);
}

export function partyName(code: string | undefined): string {
  if (!code) return "Independent";
  return PARTY_NAMES[code] ?? code;
}
