import type { EntityType, RelationshipType } from "@au-graph/data-model";

/** SVG path/shape generator per icon shape, used by both node rendering and
 * the Legend swatches so they can never drift out of sync. Each returns path
 * `d` data (or a shape tag) centered at (0,0) for a given half-size `r`. */
export type IconShape =
  | "seal"
  | "crown"
  | "vice-crown"
  | "council"
  | "circle"
  | "square"
  | "hexagon"
  | "diamond"
  | "badge"
  | "gavel";

export const ENTITY_TYPE_ICON: Record<EntityType, IconShape> = {
  electorate_body: "seal",
  head_of_state: "crown",
  vice_regal: "vice-crown",
  elected_office: "circle",
  executive_office: "hexagon",
  executive_council: "council",
  department: "square",
  department_head: "badge",
  court: "diamond",
  judicial_office: "gavel",
  statutory_agency: "square",
  commission: "diamond",
  advisory_body: "circle",
  corporation: "square",
  quasi_official: "square",
  sub_agency: "square",
};

export const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  electorate_body: "Electors",
  head_of_state: "Head of State",
  vice_regal: "Governor-General",
  elected_office: "Elected office",
  executive_office: "Executive office",
  executive_council: "Executive council",
  department: "Department",
  department_head: "Department head",
  court: "Court",
  judicial_office: "Judicial office",
  statutory_agency: "Statutory agency",
  commission: "Commission",
  advisory_body: "Advisory body",
  corporation: "Corporation",
  quasi_official: "Quasi-official body",
  sub_agency: "Sub-agency",
};

export const RELATIONSHIP_STYLE: Record<
  RelationshipType,
  { dash?: string; label: string }
> = {
  elects: { label: "Elects" },
  appoints: { label: "Appoints" },
  advises: { dash: "2 4", label: "Advises" },
  recommends: { dash: "2 4", label: "Recommends" },
  administers: { dash: "6 3", label: "Administers" },
  oversees: { dash: "6 3", label: "Oversees" },
  heads: { label: "Heads" },
  member_of: { dash: "1 3", label: "Member of" },
  ex_officio: { dash: "1 3", label: "Ex officio" },
  reports_to: { dash: "2 4", label: "Reports to" },
  delegates: { dash: "2 4", label: "Delegates" },
};

export const BRANCH_COLOR: Record<string, string> = {
  crown: "#c9a227",
  legislative: "#b8463d",
  executive: "#6b7280",
  judicial: "#8a8540",
};
