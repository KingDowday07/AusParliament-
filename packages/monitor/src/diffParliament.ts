import type { ChangeEvent, OfficeholderTerm } from "@au-graph/data-model";

/** Only the `terms` field is actually read — narrowed so callers (like the
 * refresh-parliament job) don't need to reconstruct a full AphNormalized
 * shape just to pass in what's currently stored. */
export interface TermsSnapshot {
  terms: OfficeholderTerm[];
}

export interface DiffResult {
  changeEvents: ChangeEvent[];
  /** Existing stored terms that should have endDate set (closed out). */
  closedTermPatches: { termId: string; endDate: string }[];
  /** New rows to insert — either a brand-new seat/position, or the new
   * open term created when an officeholder changes. */
  newOrUpdatedTerms: OfficeholderTerm[];
}

/**
 * Structured diff between two APH snapshots (same shape the live ingest
 * adapter produces), keyed by term id. Because aph.ts derives term ids
 * deterministically from the seat (electorate/state index, or the
 * minister-title slug), the SAME id reappearing with a different personId
 * means "officeholder changed"; an id disappearing/appearing means the
 * seat or ministerial position itself was abolished/created (a machinery-
 * of-government change, not just a reshuffle) — this is the "confirmed"
 * tier of change detection described in the plan (vs. the LLM-assisted
 * "reported"/"pending_review" tier for unstructured news/gazette text,
 * which isn't implemented yet).
 */
export function diffParliamentSnapshots(
  previous: TermsSnapshot,
  current: TermsSnapshot,
  detectedAt: string,
): DiffResult {
  const changeEvents: ChangeEvent[] = [];
  const closedTermPatches: DiffResult["closedTermPatches"] = [];
  const newOrUpdatedTerms: OfficeholderTerm[] = [];

  const prevTermsById = new Map(previous.terms.map((t) => [t.id, t]));
  const currTermsById = new Map(current.terms.map((t) => [t.id, t]));

  for (const [termId, currTerm] of currTermsById) {
    const prevTerm = prevTermsById.get(termId);

    if (!prevTerm) {
      // Brand-new seat or ministerial position.
      newOrUpdatedTerms.push(currTerm);
      changeEvents.push({
        id: `change-${termId}-appointed-${detectedAt}`,
        type: "APPOINTED",
        seatId: currTerm.seatId,
        predecessorTermId: null,
        successorTermId: currTerm.id,
        occurredAt: currTerm.startDate,
        detectedAt,
        sourceUrl: currTerm.sourceUrl,
        confidence: "confirmed",
      });
      continue;
    }

    if (prevTerm.personId !== currTerm.personId) {
      closedTermPatches.push({ termId: prevTerm.id, endDate: currTerm.startDate });
      const updatedTerm: OfficeholderTerm = {
        ...currTerm,
        id: `${currTerm.id}-${currTerm.startDate}`,
        predecessorTermId: prevTerm.id,
      };
      newOrUpdatedTerms.push(updatedTerm);
      changeEvents.push({
        id: `change-${termId}-appointed-${detectedAt}`,
        type: "APPOINTED",
        seatId: currTerm.seatId,
        predecessorTermId: prevTerm.id,
        successorTermId: updatedTerm.id,
        occurredAt: currTerm.startDate,
        detectedAt,
        sourceUrl: currTerm.sourceUrl,
        confidence: "confirmed",
      });
    }
  }

  for (const [termId, prevTerm] of prevTermsById) {
    if (!currTermsById.has(termId)) {
      closedTermPatches.push({ termId: prevTerm.id, endDate: detectedAt });
      changeEvents.push({
        id: `change-${termId}-vacated-${detectedAt}`,
        type: "VACATED",
        seatId: prevTerm.seatId,
        predecessorTermId: prevTerm.id,
        successorTermId: null,
        occurredAt: detectedAt,
        detectedAt,
        sourceUrl: prevTerm.sourceUrl,
        confidence: "confirmed",
      });
    }
  }

  return { changeEvents, closedTermPatches, newOrUpdatedTerms };
}
