import type { OfficeholderTerm } from "@au-graph/data-model";
import type { GraphData } from "@au-graph/db";

const BULK_IMPORT_SOURCE_MARKER = "static.aph.gov.au";

/**
 * The Parliament CSV import gives every one of the 226 current members the
 * same placeholder start date (the last election), which would otherwise
 * flood a "recent changes" feed with one giant fake cluster. Excluding that
 * source leaves only the individually-researched terms (Crown, Secretaries,
 * Justices) that have genuine, distinct, sourced dates — fewer items, but
 * every one of them real.
 */
export function getIndividuallySourcedTerms(data: GraphData): OfficeholderTerm[] {
  return data.terms.filter((t) => !t.sourceUrl.includes(BULK_IMPORT_SOURCE_MARKER));
}

export interface ChangeFeedEntry {
  term: OfficeholderTerm;
  seatLabel: string;
  entityName: string;
  entityId: string;
  personName: string | null;
  daysAgo: number;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function getChangeFeed(data: GraphData, windowDays: number, now = new Date()): ChangeFeedEntry[] {
  const seatsById = new Map(data.seats.map((s) => [s.id, s]));
  const entitiesById = new Map(data.entities.map((e) => [e.id, e]));
  const personsById = new Map(data.persons.map((p) => [p.id, p]));

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - windowDays);

  return getIndividuallySourcedTerms(data)
    .filter((t) => new Date(t.startDate) >= cutoff)
    .map((t) => {
      const seat = seatsById.get(t.seatId);
      const entity = seat ? entitiesById.get(seat.entityId) : undefined;
      const person = personsById.get(t.personId);
      return {
        term: t,
        seatLabel: seat?.label ?? "Unknown seat",
        entityName: entity?.name ?? "Unknown entity",
        entityId: entity?.id ?? "",
        personName: person?.name ?? null,
        daysAgo: daysBetween(now, new Date(t.startDate)),
      };
    })
    .sort((a, b) => (a.term.startDate < b.term.startDate ? 1 : -1));
}

/** Seats with no term at all count as vacant too, not just ones whose term
 * was explicitly closed — e.g. the Department Secretaries this dataset
 * deliberately left unconfirmed rather than guess a name. */
export function getSeatsVacantCount(data: GraphData): number {
  const filledSeatIds = new Set(data.terms.filter((t) => t.endDate === null).map((t) => t.seatId));
  return data.seats.filter((s) => !filledSeatIds.has(s.id)).length;
}

export function getLastChangeDaysAgo(data: GraphData, now = new Date()): number | null {
  const dated = getIndividuallySourcedTerms(data);
  if (dated.length === 0) return null;
  const latest = dated.reduce((a, b) => (a.startDate > b.startDate ? a : b));
  return daysBetween(now, new Date(latest.startDate));
}
