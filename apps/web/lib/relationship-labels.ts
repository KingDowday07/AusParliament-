import type { RelationshipType } from "@au-graph/data-model";

/** Direction-aware label, e.g. outgoing "appoints" -> "Appoints", incoming
 * "appoints" -> "Appointed by" — mirrors CivLab's grouped section headers
 * like "Elected by" / "Appoints" / "Advised by". */
export function connectionGroupLabel(type: RelationshipType, direction: "outgoing" | "incoming"): string {
  const pairs: Record<RelationshipType, [string, string]> = {
    elects: ["Elects", "Elected by"],
    appoints: ["Appoints", "Appointed by"],
    advises: ["Advises", "Advised by"],
    recommends: ["Recommends", "Recommended by"],
    administers: ["Administers", "Administered by"],
    oversees: ["Oversees", "Overseen by"],
    heads: ["Heads", "Headed by"],
    member_of: ["Includes as member", "Member of"],
    ex_officio: ["Ex officio over", "Ex officio under"],
    reports_to: ["Receives reports from", "Reports to"],
    delegates: ["Delegates to", "Delegated by"],
  };
  const [outgoing, incoming] = pairs[type];
  return direction === "outgoing" ? outgoing : incoming;
}
