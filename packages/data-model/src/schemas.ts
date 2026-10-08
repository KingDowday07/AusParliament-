import { z } from "zod";
import {
  BRANCHES,
  CHANGE_EVENT_TYPES,
  CONFIDENCE_LEVELS,
  ENTITY_TYPES,
  PREDECESSOR_UNKNOWN_REASONS,
  RELATIONSHIP_TYPES,
} from "./enums";

export const dataSourceRefSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  license: z.string().optional(),
  fetchedAt: z.string(),
});

export const entitySchema = z.object({
  id: z.string(),
  slug: z.string(),
  type: z.enum(ENTITY_TYPES),
  name: z.string(),
  shortName: z.string().optional(),
  branch: z.enum(BRANCHES),
  portfolio: z.string().optional(),
  description: z.string(),
  legalBasisText: z.string().optional(),
  legalSourceUrl: z.string().url().optional(),
  officialWebsiteUrl: z.string().url().optional(),
  abn: z.string().optional(),
  agorClassification: z.string().optional(),
  parentEntityId: z.string().optional(),
  iconShape: z.string(),
  hierarchyLevel: z.number().int().min(0),
  dataSource: z.array(dataSourceRefSchema).default([]),
});

export const seatSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  label: z.string(),
  seatIndex: z.number().int().min(1),
  totalSeats: z.number().int().min(1),
  jurisdiction: z.string().optional(),
});

export const personSchema = z.object({
  id: z.string(),
  name: z.string(),
  photoUrl: z.string().url().optional(),
  partyAffiliation: z.string().optional(),
  bioShort: z.string().optional(),
});

export const officeholderTermSchema = z.object({
  id: z.string(),
  seatId: z.string(),
  personId: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  installingRelationshipId: z.string(),
  sourceUrl: z.string(),
  confidence: z.enum(CONFIDENCE_LEVELS),
  predecessorTermId: z.string().nullable(),
  predecessorUnknownReason: z.enum(PREDECESSOR_UNKNOWN_REASONS).optional(),
});

export const relationshipSchema = z.object({
  id: z.string(),
  type: z.enum(RELATIONSHIP_TYPES),
  fromEntityId: z.string(),
  toEntityId: z.string(),
  description: z.string().optional(),
  legalSourceUrl: z.string().url().optional(),
});

export const newsItemSchema = z.object({
  id: z.string(),
  headline: z.string(),
  bodyMarkdown: z.string(),
  publishedAt: z.string(),
  sourceUrl: z.string().url(),
  sourceName: z.string(),
  relatedEntityIds: z.array(z.string()).default([]),
  thumbnailUrl: z.string().url().optional(),
});

export const changeEventSchema = z.object({
  id: z.string(),
  type: z.enum(CHANGE_EVENT_TYPES),
  seatId: z.string().optional(),
  entityId: z.string().optional(),
  predecessorTermId: z.string().nullable(),
  successorTermId: z.string().nullable(),
  occurredAt: z.string(),
  detectedAt: z.string(),
  sourceUrl: z.string(),
  confidence: z.enum(CONFIDENCE_LEVELS),
});

export const entityAliasSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  alias: z.string(),
});

/** Full seed-file shape for packages/db/seed/*.json */
export const seedFileSchema = z.object({
  entities: z.array(entitySchema),
  seats: z.array(seatSchema).default([]),
  persons: z.array(personSchema).default([]),
  terms: z.array(officeholderTermSchema).default([]),
  relationships: z.array(relationshipSchema).default([]),
});
export type SeedFile = z.infer<typeof seedFileSchema>;
