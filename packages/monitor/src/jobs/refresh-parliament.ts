/**
 * Scheduled job (see .github/workflows/refresh-parliament.yml): fetches the
 * live APH CSVs, diffs them against what's currently stored, and persists
 * any detected changes. Requires DATABASE_URL — see packages/db/src/client.ts.
 *
 * Run live against Neon once (2026-10-08) during development: it completed
 * successfully but surfaced two real bugs, both fixed here —
 *  1. loadStoredSnapshot() originally loaded *every* open term, not just
 *     the ones aphAdapter manages, so it diffed APH's output against
 *     hand-curated Crown/Secretary/Justice terms too and incorrectly
 *     marked 14 of them VACATED. Now scoped to House/Senate/executive_office.
 *  2. The process never exited after finishing — the `postgres` package
 *     keeps a connection pool alive, which keeps Node's event loop alive
 *     indefinitely unless the process exits explicitly.
 */
import { eq, inArray, isNull } from "drizzle-orm";
import { getDb, schema } from "@au-graph/db";
import { aphAdapter } from "@au-graph/ingest";
import { diffParliamentSnapshots, type DiffResult, type TermsSnapshot } from "../diffParliament.js";

const MANAGED_CHAMBER_ENTITY_IDS = ["au-chamber-house-of-representatives", "au-chamber-senate"];

/** Only currently-open terms *within what this adapter actually manages*
 * (Parliament seats + ministerial offices) — anything else open in storage
 * (Crown, Department Secretaries, Justices) is out of scope for this diff
 * and must not be treated as "disappeared" just because APH's CSVs don't
 * mention it. */
async function loadStoredSnapshot(): Promise<TermsSnapshot> {
  const db = getDb();

  const managedSeats = await db
    .select({ id: schema.seats.id })
    .from(schema.seats)
    .innerJoin(schema.entities, eq(schema.entities.id, schema.seats.entityId))
    .where(inArray(schema.seats.entityId, MANAGED_CHAMBER_ENTITY_IDS));
  const ministerSeats = await db
    .select({ id: schema.seats.id })
    .from(schema.seats)
    .innerJoin(schema.entities, eq(schema.entities.id, schema.seats.entityId))
    .where(eq(schema.entities.type, "executive_office"));
  const managedSeatIds = [...managedSeats, ...ministerSeats].map((s) => s.id);

  const terms = await db
    .select()
    .from(schema.officeholderTerms)
    .where(isNull(schema.officeholderTerms.endDate));
  const scoped = terms.filter((t) => managedSeatIds.includes(t.seatId));
  return { terms: scoped as TermsSnapshot["terms"] };
}

async function applyDiff(result: DiffResult, detectedAt: string): Promise<void> {
  const db = getDb();

  for (const patch of result.closedTermPatches) {
    await db
      .update(schema.officeholderTerms)
      .set({ endDate: patch.endDate })
      .where(eq(schema.officeholderTerms.id, patch.termId));
  }

  for (const term of result.newOrUpdatedTerms) {
    await db.insert(schema.officeholderTerms).values(term).onConflictDoNothing();
  }

  for (const event of result.changeEvents) {
    await db.insert(schema.changeEvents).values({ ...event, detectedAt: new Date(detectedAt) });
  }
}

export async function refreshParliament(): Promise<{ changeCount: number }> {
  const startedAt = new Date();
  const ingestionRunId = `run-aph-${startedAt.toISOString()}`;
  const db = getDb();
  await db.insert(schema.ingestionRuns).values({
    id: ingestionRunId,
    sourceName: aphAdapter.name,
    startedAt,
    status: "running",
  });

  try {
    const [previous, raw] = await Promise.all([loadStoredSnapshot(), aphAdapter.fetchRaw()]);
    const current = aphAdapter.normalize(raw);
    const detectedAt = new Date().toISOString();

    const result = diffParliamentSnapshots(previous, current, detectedAt);
    await applyDiff(result, detectedAt);

    await db
      .update(schema.ingestionRuns)
      .set({ finishedAt: new Date(), status: "succeeded", recordsProcessed: current.terms.length })
      .where(eq(schema.ingestionRuns.id, ingestionRunId));

    return { changeCount: result.changeEvents.length };
  } catch (err) {
    await db
      .update(schema.ingestionRuns)
      .set({
        finishedAt: new Date(),
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      .where(eq(schema.ingestionRuns.id, ingestionRunId));
    throw err;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  refreshParliament()
    .then(({ changeCount }) => {
      console.log(`refresh-parliament: ${changeCount} change event(s) recorded`);
      process.exit(0); // postgres's connection pool otherwise keeps the process alive forever
    })
    .catch((err) => {
      console.error("refresh-parliament failed:", err);
      process.exit(1);
    });
}
