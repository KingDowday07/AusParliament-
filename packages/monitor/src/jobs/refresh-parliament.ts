/**
 * Scheduled job (see .github/workflows/refresh-parliament.yml): fetches the
 * live APH CSVs, diffs them against what's currently stored, and persists
 * any detected changes. Requires DATABASE_URL — see packages/db/src/client.ts.
 *
 * NOT YET RUNNABLE END-TO-END: there is no live Postgres/Neon instance
 * wired up in this environment, so this job has not been executed against
 * real storage. It typechecks and its diffing logic is unit-tested
 * (diffParliament.test.ts); what's untested is the DB read/write path,
 * which needs a real DATABASE_URL to exercise.
 */
import { eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@au-graph/db";
import { aphAdapter } from "@au-graph/ingest";
import { diffParliamentSnapshots, type DiffResult, type TermsSnapshot } from "../diffParliament.js";

/** Only currently-open terms matter for diffing against a fresh CSV pull —
 * a closed term can't "change officeholder" again. */
async function loadStoredSnapshot(): Promise<TermsSnapshot> {
  const db = getDb();
  const terms = await db
    .select()
    .from(schema.officeholderTerms)
    .where(isNull(schema.officeholderTerms.endDate));
  return { terms: terms as TermsSnapshot["terms"] };
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
    })
    .catch((err) => {
      console.error("refresh-parliament failed:", err);
      process.exit(1);
    });
}
