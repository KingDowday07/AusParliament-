import { V1_SCOPE_ENTITY_TYPES, RELATIONSHIP_TYPES, type EntityType } from "@au-graph/data-model";
import { ENTITY_TYPE_ICON, ENTITY_TYPE_LABEL, RELATIONSHIP_STYLE } from "./entity-icon-map";

/** Only entity types actually populated in this dataset are shown — the
 * Phase 2 types (statutory agencies, commissions, ...) stay out of the
 * legend until they're real, not just declared in the enum. */
export const LEGEND_ENTITY_TYPES: { type: EntityType; label: string }[] = [...V1_SCOPE_ENTITY_TYPES].map(
  (type) => ({ type, label: ENTITY_TYPE_LABEL[type] }),
);

export const LEGEND_RELATIONSHIP_TYPES = RELATIONSHIP_TYPES.map((type) => ({
  type,
  label: RELATIONSHIP_STYLE[type].label,
  dash: RELATIONSHIP_STYLE[type].dash,
}));

export { ENTITY_TYPE_ICON };
