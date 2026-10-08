/**
 * One-time (and re-runnable) loader: reads the packages/db/seed/*.json
 * files via loadSeed() and writes them into the live Postgres instance
 * pointed at by DATABASE_URL. Idempotent — truncates the tables this
 * script owns and reinserts, since the JSON seed files remain the source
 * of truth until a future admin UI lets the DB itself be edited directly.
 */
import "./loadEnv.js";
import { sql } from "drizzle-orm";
import { getDb } from "./client.js";
import * as schema from "./schema.js";
import { loadSeed } from "./loadSeed.js";

async function main() {
  const data = await loadSeed();
  const db = getDb();

  const entityTypeLabels = new Map<string, string>();
  const relationshipTypeLabels = new Map<string, string>();
  for (const e of data.entities) {
    if (!entityTypeLabels.has(e.type)) {
      entityTypeLabels.set(e.type, e.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  }
  for (const r of data.relationships) {
    if (!relationshipTypeLabels.has(r.type)) {
      relationshipTypeLabels.set(r.type, r.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  }

  await db.transaction(async (tx) => {
    // Order matters only for the FK-dependent inserts below, not for this
    // truncate (CASCADE handles the dependency graph in reverse).
    await tx.execute(sql`
      TRUNCATE TABLE
        news_item_entities, news_items, change_events, officeholder_terms,
        persons, relationships, seats, entity_data_sources, entity_aliases,
        entities, entity_types, relationship_types
      RESTART IDENTITY CASCADE
    `);

    await tx.insert(schema.entityTypes).values(
      [...entityTypeLabels.entries()].map(([code, label]) => ({ code: code as never, label })),
    );
    await tx.insert(schema.relationshipTypes).values(
      [...relationshipTypeLabels.entries()].map(([code, label]) => ({ code: code as never, label })),
    );

    // Pass 1: entities without parentEntityId, to avoid FK-ordering issues
    // for the self-referencing column — set in pass 2 below.
    await tx.insert(schema.entities).values(
      data.entities.map((e) => ({
        id: e.id,
        slug: e.slug,
        type: e.type,
        name: e.name,
        shortName: e.shortName,
        branch: e.branch,
        portfolio: e.portfolio,
        description: e.description,
        legalBasisText: e.legalBasisText,
        legalSourceUrl: e.legalSourceUrl,
        officialWebsiteUrl: e.officialWebsiteUrl,
        abn: e.abn,
        agorClassification: e.agorClassification,
        parentEntityId: null,
        iconShape: e.iconShape,
        hierarchyLevel: e.hierarchyLevel,
      })),
    );

    for (const e of data.entities) {
      if (e.parentEntityId) {
        await tx.update(schema.entities).set({ parentEntityId: e.parentEntityId }).where(sql`id = ${e.id}`);
      }
    }

    const dataSourceRows = data.entities.flatMap((e, ei) =>
      e.dataSource.map((ds, dsi) => ({
        id: `${e.id}-src-${ei}-${dsi}`,
        entityId: e.id,
        name: ds.name,
        url: ds.url,
        license: ds.license,
        fetchedAt: new Date(ds.fetchedAt),
      })),
    );
    if (dataSourceRows.length) await tx.insert(schema.entityDataSources).values(dataSourceRows);

    if (data.seats.length) await tx.insert(schema.seats).values(data.seats);
    if (data.persons.length) await tx.insert(schema.persons).values(data.persons);
    if (data.relationships.length) await tx.insert(schema.relationships).values(data.relationships);
    if (data.terms.length) await tx.insert(schema.officeholderTerms).values(data.terms);

    if (data.newsItems.length) {
      await tx.insert(schema.newsItems).values(
        data.newsItems.map((n) => ({
          id: n.id,
          headline: n.headline,
          bodyMarkdown: n.bodyMarkdown,
          publishedAt: n.publishedAt,
          sourceUrl: n.sourceUrl,
          sourceName: n.sourceName,
          thumbnailUrl: n.thumbnailUrl,
        })),
      );
      const joinRows = data.newsItems.flatMap((n) =>
        n.relatedEntityIds.map((entityId) => ({ newsItemId: n.id, entityId })),
      );
      if (joinRows.length) await tx.insert(schema.newsItemEntities).values(joinRows);
    }
  });

  console.log(
    `Imported ${data.entities.length} entities, ${data.seats.length} seats, ${data.persons.length} persons, ` +
      `${data.terms.length} terms, ${data.relationships.length} relationships, ${data.newsItems.length} news items.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
