import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { seedFileSchema, type SeedFile } from "@au-graph/data-model";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(__dirname, "..", "seed");

export type GraphData = SeedFile;

/**
 * Loads and merges every seed/*.json file in this package, validates each
 * against the shared Zod schema, then checks referential integrity across
 * the merged graph (every id a relationship/seat/term points at must exist).
 * This is the single entry point the Next.js app and future DB-seeding
 * script both use, so there's one source of truth for "is this dataset
 * internally consistent."
 */
export async function loadSeed(): Promise<GraphData> {
  const files = ["core-government.json", "parliament.generated.json", "news.json"];

  const merged: GraphData = {
    entities: [],
    seats: [],
    persons: [],
    terms: [],
    relationships: [],
    newsItems: [],
  };

  for (const file of files) {
    const raw = await readFile(path.join(SEED_DIR, file), "utf-8");
    const json = JSON.parse(raw);
    const parsed = seedFileSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`Seed file ${file} failed schema validation:\n${parsed.error.toString()}`);
    }
    merged.entities.push(...parsed.data.entities);
    merged.seats.push(...parsed.data.seats);
    merged.persons.push(...parsed.data.persons);
    merged.terms.push(...parsed.data.terms);
    merged.relationships.push(...parsed.data.relationships);
    merged.newsItems.push(...parsed.data.newsItems);
  }

  checkReferentialIntegrity(merged);
  return merged;
}

function checkReferentialIntegrity(data: GraphData): void {
  const errors: string[] = [];

  const entityIds = new Set(data.entities.map((e) => e.id));
  const seatIds = new Set(data.seats.map((s) => s.id));
  const personIds = new Set(data.persons.map((p) => p.id));
  const relationshipIds = new Set(data.relationships.map((r) => r.id));

  const dupeEntityIds = findDuplicates(data.entities.map((e) => e.id));
  if (dupeEntityIds.length) errors.push(`Duplicate entity ids: ${dupeEntityIds.join(", ")}`);
  const dupeSeatIds = findDuplicates(data.seats.map((s) => s.id));
  if (dupeSeatIds.length) errors.push(`Duplicate seat ids: ${dupeSeatIds.join(", ")}`);
  const dupeRelIds = findDuplicates(data.relationships.map((r) => r.id));
  if (dupeRelIds.length) errors.push(`Duplicate relationship ids: ${dupeRelIds.join(", ")}`);

  for (const e of data.entities) {
    if (e.parentEntityId && !entityIds.has(e.parentEntityId)) {
      errors.push(`Entity ${e.id} has unknown parentEntityId ${e.parentEntityId}`);
    }
  }
  for (const s of data.seats) {
    if (!entityIds.has(s.entityId)) {
      errors.push(`Seat ${s.id} references unknown entityId ${s.entityId}`);
    }
  }
  for (const r of data.relationships) {
    if (!entityIds.has(r.fromEntityId)) {
      errors.push(`Relationship ${r.id} has unknown fromEntityId ${r.fromEntityId}`);
    }
    if (!entityIds.has(r.toEntityId)) {
      errors.push(`Relationship ${r.id} has unknown toEntityId ${r.toEntityId}`);
    }
  }
  for (const t of data.terms) {
    if (!seatIds.has(t.seatId)) errors.push(`Term ${t.id} references unknown seatId ${t.seatId}`);
    if (!personIds.has(t.personId)) errors.push(`Term ${t.id} references unknown personId ${t.personId}`);
    if (!relationshipIds.has(t.installingRelationshipId)) {
      errors.push(`Term ${t.id} references unknown installingRelationshipId ${t.installingRelationshipId}`);
    }
  }
  for (const n of data.newsItems) {
    for (const relatedId of n.relatedEntityIds) {
      if (!entityIds.has(relatedId)) {
        errors.push(`NewsItem ${n.id} references unknown relatedEntityId ${relatedId}`);
      }
    }
  }

  if (errors.length) {
    throw new Error(`Seed data referential integrity check failed:\n - ${errors.join("\n - ")}`);
  }
}

function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}
