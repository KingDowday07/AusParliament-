import type { Person, Seat } from "@au-graph/data-model";
import type { GraphData } from "@au-graph/db";
import { computeHemicycleSlots, type HemicycleSlot } from "./hemicycle-layout";

export type ChamberKey = "house" | "senate";

export const CHAMBER_ENTITY_IDS: Record<ChamberKey, string> = {
  house: "au-chamber-house-of-representatives",
  senate: "au-chamber-senate",
};

export const CHAMBER_TITLES: Record<ChamberKey, string> = {
  house: "House of Representatives",
  senate: "Senate",
};

export function chamberKeyForEntityId(entityId: string): ChamberKey | null {
  if (entityId === CHAMBER_ENTITY_IDS.house) return "house";
  if (entityId === CHAMBER_ENTITY_IDS.senate) return "senate";
  return null;
}

export interface ChamberSeatAssignment {
  seat: Seat;
  person: Person | null;
  party: string | undefined;
  slot: HemicycleSlot;
}

/**
 * Pairs each seat in a chamber with its current occupant and a hemicycle
 * slot position, ordered so same-party members cluster together (largest
 * party first, ties broken alphabetically by code) — a standard "seats by
 * party" visualization. This is NOT an official seating plan; no source
 * publishes individual real seat assignments in a form we ingest, so
 * grouping by party is the honest representation rather than a guess at
 * exact seats.
 */
export function getChamberSeatAssignments(
  data: GraphData,
  chamberEntityId: string,
  outerRadius: number,
): ChamberSeatAssignment[] {
  const seats = data.seats.filter((s) => s.entityId === chamberEntityId);
  const openTermBySeat = new Map(data.terms.filter((t) => t.endDate === null).map((t) => [t.seatId, t]));
  const personsById = new Map(data.persons.map((p) => [p.id, p]));

  const withPerson = seats.map((seat) => {
    const term = openTermBySeat.get(seat.id);
    const person = term ? (personsById.get(term.personId) ?? null) : null;
    return { seat, person, party: person?.partyAffiliation };
  });

  const partySizes = new Map<string, number>();
  for (const w of withPerson) {
    const key = w.party ?? "IND";
    partySizes.set(key, (partySizes.get(key) ?? 0) + 1);
  }
  const partyRank = new Map(
    [...partySizes.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([code], i) => [code, i]),
  );

  const ordered = [...withPerson].sort((a, b) => {
    const ra = partyRank.get(a.party ?? "IND") ?? 999;
    const rb = partyRank.get(b.party ?? "IND") ?? 999;
    return ra - rb;
  });

  const slots = computeHemicycleSlots(ordered.length, outerRadius);
  return ordered.map((o, i) => ({ ...o, slot: slots[i] }));
}
