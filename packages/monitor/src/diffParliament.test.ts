import assert from "node:assert/strict";
import type { OfficeholderTerm } from "@au-graph/data-model";
import { diffParliamentSnapshots, type TermsSnapshot } from "./diffParliament.js";

function snapshot(terms: OfficeholderTerm[] = []): TermsSnapshot {
  return { terms };
}

// --- Case 1: no change -> no events -------------------------------------
{
  const term = {
    id: "au-term-seat-a",
    seatId: "seat-a",
    personId: "person-1",
    startDate: "2025-05-12",
    endDate: null,
    installingRelationshipId: "rel-1",
    sourceUrl: "https://example.org",
    confidence: "confirmed" as const,
    predecessorTermId: null,
  };
  const prev = snapshot([term]);
  const curr = snapshot([{ ...term }]);
  const result = diffParliamentSnapshots(prev, curr, "2026-10-08");
  assert.equal(result.changeEvents.length, 0, "unchanged seat should produce no events");
  assert.equal(result.closedTermPatches.length, 0);
  assert.equal(result.newOrUpdatedTerms.length, 0);
}

// --- Case 2: officeholder changed (reshuffle) ----------------------------
{
  const oldTerm = {
    id: "au-term-seat-b",
    seatId: "seat-b",
    personId: "person-old",
    startDate: "2025-05-12",
    endDate: null,
    installingRelationshipId: "rel-1",
    sourceUrl: "https://example.org",
    confidence: "confirmed" as const,
    predecessorTermId: null,
  };
  const newTerm = { ...oldTerm, personId: "person-new", startDate: "2026-09-01" };
  const prev = snapshot([oldTerm]);
  const curr = snapshot([newTerm]);
  const result = diffParliamentSnapshots(prev, curr, "2026-10-08");

  assert.equal(result.changeEvents.length, 1);
  assert.equal(result.changeEvents[0].type, "APPOINTED");
  assert.equal(result.changeEvents[0].predecessorTermId, oldTerm.id);
  assert.equal(result.changeEvents[0].occurredAt, "2026-09-01");

  assert.equal(result.closedTermPatches.length, 1);
  assert.equal(result.closedTermPatches[0].termId, oldTerm.id);
  assert.equal(result.closedTermPatches[0].endDate, "2026-09-01");

  assert.equal(result.newOrUpdatedTerms.length, 1);
  assert.equal(result.newOrUpdatedTerms[0].personId, "person-new");
  assert.equal(result.newOrUpdatedTerms[0].predecessorTermId, oldTerm.id);
  assert.notEqual(result.newOrUpdatedTerms[0].id, oldTerm.id, "new term must not collide with the closed one");
}

// --- Case 3: brand-new seat/position appears -----------------------------
{
  const term = {
    id: "au-term-seat-c",
    seatId: "seat-c",
    personId: "person-1",
    startDate: "2026-10-01",
    endDate: null,
    installingRelationshipId: "rel-1",
    sourceUrl: "https://example.org",
    confidence: "confirmed" as const,
    predecessorTermId: null,
  };
  const prev = snapshot([]);
  const curr = snapshot([term]);
  const result = diffParliamentSnapshots(prev, curr, "2026-10-08");

  assert.equal(result.changeEvents.length, 1);
  assert.equal(result.changeEvents[0].type, "APPOINTED");
  assert.equal(result.changeEvents[0].predecessorTermId, null);
  assert.equal(result.newOrUpdatedTerms.length, 1);
}

// --- Case 4: seat/position disappears (machinery-of-government change) --
{
  const term = {
    id: "au-term-seat-d",
    seatId: "seat-d",
    personId: "person-1",
    startDate: "2025-05-12",
    endDate: null,
    installingRelationshipId: "rel-1",
    sourceUrl: "https://example.org",
    confidence: "confirmed" as const,
    predecessorTermId: null,
  };
  const prev = snapshot([term]);
  const curr = snapshot([]);
  const result = diffParliamentSnapshots(prev, curr, "2026-10-08");

  assert.equal(result.changeEvents.length, 1);
  assert.equal(result.changeEvents[0].type, "VACATED");
  assert.equal(result.changeEvents[0].predecessorTermId, term.id);
  assert.equal(result.changeEvents[0].successorTermId, null);
  assert.equal(result.closedTermPatches.length, 1);
  assert.equal(result.closedTermPatches[0].endDate, "2026-10-08");
}

console.log("diffParliament: all cases passed");
