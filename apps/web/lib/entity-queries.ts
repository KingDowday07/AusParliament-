import type { Entity, OfficeholderTerm, Person, Relationship, Seat } from "@au-graph/data-model";
import type { GraphData } from "@au-graph/db";

export interface OfficeholderView {
  seat: Seat;
  person: Person | null;
  term: OfficeholderTerm | null;
}

export function getSeatsForEntity(data: GraphData, entityId: string): Seat[] {
  return data.seats.filter((s) => s.entityId === entityId);
}

export function getCurrentOfficeholders(data: GraphData, entityId: string): OfficeholderView[] {
  const seats = getSeatsForEntity(data, entityId);
  const personsById = new Map(data.persons.map((p) => [p.id, p]));
  return seats.map((seat) => {
    const term = data.terms.find((t) => t.seatId === seat.id && t.endDate === null) ?? null;
    const person = term ? (personsById.get(term.personId) ?? null) : null;
    return { seat, person, term };
  });
}

export interface ConnectionGroup {
  type: Relationship["type"];
  direction: "outgoing" | "incoming";
  entities: Entity[];
}

/** Groups an entity's relationships by type + direction, for the "Who's
 * connected?" tab — mirrors CivLab's grouped sections (e.g. "Appoints",
 * "Advised by"). */
export function getConnectionGroups(data: GraphData, entityId: string): ConnectionGroup[] {
  const entitiesById = new Map(data.entities.map((e) => [e.id, e]));
  const groups = new Map<string, ConnectionGroup>();

  for (const rel of data.relationships) {
    if (rel.fromEntityId === entityId) {
      const other = entitiesById.get(rel.toEntityId);
      if (!other) continue;
      const key = `${rel.type}:outgoing`;
      const group = groups.get(key) ?? { type: rel.type, direction: "outgoing", entities: [] };
      group.entities.push(other);
      groups.set(key, group);
    }
    if (rel.toEntityId === entityId) {
      const other = entitiesById.get(rel.fromEntityId);
      if (!other) continue;
      const key = `${rel.type}:incoming`;
      const group = groups.get(key) ?? { type: rel.type, direction: "incoming", entities: [] };
      group.entities.push(other);
      groups.set(key, group);
    }
  }

  for (const group of groups.values()) {
    group.entities.sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...groups.values()];
}
