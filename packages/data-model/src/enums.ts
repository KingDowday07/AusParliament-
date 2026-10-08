/**
 * Branches / sectors of the power map. "crown" is the fourth sector that has
 * no equivalent in CivLab's US model: Australia is a constitutional monarchy,
 * so the King and Governor-General sit outside the legislative/executive/
 * judicial split as a reserve/formal-authority sector.
 */
export const BRANCHES = ["crown", "legislative", "executive", "judicial"] as const;
export type Branch = (typeof BRANCHES)[number];

/**
 * Entity types. The "v1Scope" flag marks which types are populated in the
 * core-government milestone (M1) vs reserved for the later full-AGOR
 * expansion (M6) — see plan doc. Kept as a const table (not a bare union)
 * so icon/legend config can be derived from the same source of truth.
 */
export const ENTITY_TYPES = [
  "electorate_body", // root: "The Australian Electors"
  "head_of_state", // The King
  "vice_regal", // Governor-General
  "elected_office", // MP seat, Senator seat
  "executive_office", // PM, Minister, Assistant Minister
  "executive_council", // Federal Executive Council, Cabinet (grouping entities)
  "department", // Commonwealth Department (per the AAO)
  "department_head", // Departmental Secretary
  "court", // High Court, Federal Court
  "judicial_office", // Justice / Judge
  // --- reserved for Phase 2 (M6), not populated in v1 ---
  "statutory_agency",
  "commission",
  "advisory_body",
  "corporation",
  "quasi_official",
  "sub_agency",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const V1_SCOPE_ENTITY_TYPES: ReadonlySet<EntityType> = new Set([
  "electorate_body",
  "head_of_state",
  "vice_regal",
  "elected_office",
  "executive_office",
  "executive_council",
  "department",
  "department_head",
  "court",
  "judicial_office",
]);

export const RELATIONSHIP_TYPES = [
  "elects",
  "appoints",
  "advises",
  "recommends",
  "administers",
  "oversees",
  "heads",
  "member_of",
  "ex_officio",
  "reports_to",
  "delegates",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const CHANGE_EVENT_TYPES = [
  "APPOINTED",
  "DEPARTED",
  "ACTING",
  "VACATED",
  "STRUCTURAL_CHANGE",
] as const;
export type ChangeEventType = (typeof CHANGE_EVENT_TYPES)[number];

export const CONFIDENCE_LEVELS = ["confirmed", "reported", "pending_review"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const PREDECESSOR_UNKNOWN_REASONS = ["pre-launch-gap", "source-silent"] as const;
export type PredecessorUnknownReason = (typeof PREDECESSOR_UNKNOWN_REASONS)[number];
