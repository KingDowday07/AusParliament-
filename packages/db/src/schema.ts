import {
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  BRANCHES,
  CHANGE_EVENT_TYPES,
  CONFIDENCE_LEVELS,
  ENTITY_TYPES,
  PREDECESSOR_UNKNOWN_REASONS,
  RELATIONSHIP_TYPES,
} from "@au-graph/data-model";

/**
 * Postgres schema (Drizzle ORM), for the M4 live-monitoring milestone.
 *
 * NOT YET CONNECTED: the running app still reads packages/db/seed/*.json
 * via loadSeed() — this schema exists so the structure is designed and
 * ready, but applying it requires a real Postgres instance (e.g. Neon)
 * that this environment doesn't have credentials for. See
 * packages/monitor/README for the migration path once DATABASE_URL exists.
 *
 * `entity_types` / `relationship_types` are reference tables seeded from
 * the data-model enums rather than Postgres enum types, per the plan: new
 * Phase-2 entity/relationship types become a data change, not a schema
 * migration that touches every table referencing them.
 */

export const entityTypes = pgTable("entity_types", {
  code: text("code").primaryKey().$type<(typeof ENTITY_TYPES)[number]>(),
  label: text("label").notNull(),
});

export const relationshipTypes = pgTable("relationship_types", {
  code: text("code").primaryKey().$type<(typeof RELATIONSHIP_TYPES)[number]>(),
  label: text("label").notNull(),
});

export const entities = pgTable("entities", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull().$type<(typeof ENTITY_TYPES)[number]>(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  branch: text("branch").notNull().$type<(typeof BRANCHES)[number]>(),
  portfolio: text("portfolio"),
  description: text("description").notNull(),
  legalBasisText: text("legal_basis_text"),
  legalSourceUrl: text("legal_source_url"),
  officialWebsiteUrl: text("official_website_url"),
  abn: text("abn"),
  agorClassification: text("agor_classification"),
  parentEntityId: text("parent_entity_id"),
  iconShape: text("icon_shape").notNull(),
  hierarchyLevel: integer("hierarchy_level").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Normalizes Entity.dataSource[] (provenance per record) into its own table. */
export const entityDataSources = pgTable("entity_data_sources", {
  id: text("id").primaryKey(),
  entityId: text("entity_id")
    .notNull()
    .references(() => entities.id),
  name: text("name").notNull(),
  url: text("url").notNull(),
  license: text("license"),
  fetchedAt: timestamp("fetched_at").notNull(),
});

export const entityAliases = pgTable("entity_aliases", {
  id: text("id").primaryKey(),
  entityId: text("entity_id")
    .notNull()
    .references(() => entities.id),
  alias: text("alias").notNull(),
});

export const seats = pgTable("seats", {
  id: text("id").primaryKey(),
  entityId: text("entity_id")
    .notNull()
    .references(() => entities.id),
  label: text("label").notNull(),
  seatIndex: integer("seat_index").notNull(),
  totalSeats: integer("total_seats").notNull(),
  jurisdiction: text("jurisdiction"),
});

export const persons = pgTable("persons", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  partyAffiliation: text("party_affiliation"),
  bioShort: text("bio_short"),
});

export const relationships = pgTable("relationships", {
  id: text("id").primaryKey(),
  type: text("type").notNull().$type<(typeof RELATIONSHIP_TYPES)[number]>(),
  fromEntityId: text("from_entity_id")
    .notNull()
    .references(() => entities.id),
  toEntityId: text("to_entity_id")
    .notNull()
    .references(() => entities.id),
  description: text("description"),
  legalSourceUrl: text("legal_source_url"),
});

export const officeholderTerms = pgTable("officeholder_terms", {
  id: text("id").primaryKey(),
  seatId: text("seat_id")
    .notNull()
    .references(() => seats.id),
  personId: text("person_id")
    .notNull()
    .references(() => persons.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  installingRelationshipId: text("installing_relationship_id")
    .notNull()
    .references(() => relationships.id),
  sourceUrl: text("source_url").notNull(),
  confidence: text("confidence").notNull().$type<(typeof CONFIDENCE_LEVELS)[number]>(),
  predecessorTermId: text("predecessor_term_id"),
  predecessorUnknownReason: text("predecessor_unknown_reason").$type<
    (typeof PREDECESSOR_UNKNOWN_REASONS)[number] | null
  >(),
});

export const newsItems = pgTable("news_items", {
  id: text("id").primaryKey(),
  headline: text("headline").notNull(),
  bodyMarkdown: text("body_markdown").notNull(),
  publishedAt: date("published_at").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceName: text("source_name").notNull(),
  thumbnailUrl: text("thumbnail_url"),
});

/** Many-to-many: a news item can mention several entities. */
export const newsItemEntities = pgTable(
  "news_item_entities",
  {
    newsItemId: text("news_item_id")
      .notNull()
      .references(() => newsItems.id),
    entityId: text("entity_id")
      .notNull()
      .references(() => entities.id),
  },
  (t) => [primaryKey({ columns: [t.newsItemId, t.entityId] })],
);

/**
 * Written only by packages/monitor jobs. `confidence: "pending_review"`
 * doubles as the review queue (per the plan's note that a separate staging
 * table is a premature abstraction until the LLM-extraction path exists) —
 * those rows are excluded from every public query until approved.
 */
export const changeEvents = pgTable("change_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull().$type<(typeof CHANGE_EVENT_TYPES)[number]>(),
  seatId: text("seat_id").references(() => seats.id),
  entityId: text("entity_id").references(() => entities.id),
  predecessorTermId: text("predecessor_term_id"),
  successorTermId: text("successor_term_id"),
  occurredAt: date("occurred_at").notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  sourceUrl: text("source_url").notNull(),
  confidence: text("confidence").notNull().$type<(typeof CONFIDENCE_LEVELS)[number]>(),
});

/** Audit log: one row per scheduled job run, for debugging source failures. */
export const ingestionRuns = pgTable("ingestion_runs", {
  id: text("id").primaryKey(),
  sourceName: text("source_name").notNull(),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
  status: text("status").notNull().$type<"running" | "succeeded" | "failed">(),
  recordsProcessed: integer("records_processed"),
  errorMessage: text("error_message"),
});
