import { parse } from "csv-parse/sync";
import type {
  Entity,
  OfficeholderTerm,
  Person,
  Relationship,
  Seat,
} from "@au-graph/data-model";
import type { IngestAdapter } from "../adapter";

const SENATORS_CSV_URL =
  "https://static.aph.gov.au/-/media/03_Senators_and_Members/Address_Labels_and_CSV_files/Senators/allsenel.csv";
const MEMBERS_CSV_URL =
  "https://static.aph.gov.au/-/media/03_Senators_and_Members/Address_Labels_and_CSV_files/FamilynameRepsCSV.csv";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export interface AphRaw {
  senatorsCsv: string;
  membersCsv: string;
  fetchedAt: string;
}

export interface AphNormalized {
  entities: Entity[]; // House of Representatives, Senate chamber entities + Minister executive_office entities
  seats: Seat[];
  persons: Person[];
  terms: OfficeholderTerm[];
  relationships: Relationship[];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Titles that mark a genuine ministerial/executive office (vs. procedural or
 * party roles like "Opposition Whip" or "President of the Senate", which are
 * out of scope for v1 — see plan doc "core government" scope).
 */
// Lookbehind exclusions stop a short phrase (e.g. "Minister for", "Treasurer")
// from matching where it's embedded inside a longer one (e.g. "Assistant
// Minister for...", "Deputy Prime Minister", "Assistant Treasurer") — without
// them the regex would wrongly split those compounds and drop the qualifier.
const MINISTERIAL_START_PHRASES = [
  "Assistant Minister (?:for|to|assisting)",
  "(?<!Assistant )Minister (?:for|assisting)",
  "Deputy Prime Minister",
  "(?<!Deputy )(?<!to the )Prime Minister",
  "Cabinet Secretary",
  "Special Minister of State",
  "Attorney-General",
  "Assistant Treasurer",
  "(?<!Assistant )Treasurer",
] as const;

const SPLIT_RE = new RegExp(`(?=(?:${MINISTERIAL_START_PHRASES.join("|")}))`, "g");

const MINISTERIAL_TEST_RE = new RegExp(
  `^(?:${MINISTERIAL_START_PHRASES.join("|")})`,
);

/** Strips "(...)" procedural asides, returning the cleaned string + the note. */
function extractParenthetical(raw: string): { cleaned: string; note?: string } {
  const match = raw.match(/\(([^)]+)\)/);
  if (!match) return { cleaned: raw.trim() };
  return { cleaned: raw.replace(match[0], "").trim(), note: match[1].trim() };
}

/** Splits a raw title field (which may lack delimiters, or use "; ") into
 * individual ministerial titles, dropping non-ministerial procedural/party
 * titles (whip, leader of opposition, etc.) per MINISTERIAL_TEST_RE. */
export function splitMinisterialTitles(rawField: string): { titles: string[]; note?: string } {
  const { cleaned, note } = extractParenthetical(rawField);
  if (!cleaned) return { titles: [], note };

  const segments = cleaned.includes("; ")
    ? cleaned.split("; ")
    : cleaned.split(SPLIT_RE);

  const titles = segments
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && MINISTERIAL_TEST_RE.test(s));

  return { titles, note };
}

interface SenatorRow {
  Surname: string;
  "First Name": string;
  "Other Name": string;
  State: string;
  "Political Party": string;
  Gender: string;
  "Parliamentary Titles": string;
}

interface MemberRow {
  Surname: string;
  "First Name": string;
  "Other Name": string;
  Electorate: string;
  State: string;
  "Political Party": string;
  Gender: string;
  "Ministerial Title": string;
  "Parliamentary Title": string;
}

const fetchedAtNow = () => new Date().toISOString();

export const aphAdapter: IngestAdapter<AphRaw, AphNormalized> = {
  name: "aph-senators-members",
  sourceUrl: `${SENATORS_CSV_URL} , ${MEMBERS_CSV_URL}`,
  license: undefined, // APH does not publish an explicit CC license for these CSVs; treat as factual public data, link out rather than republish verbatim text fields beyond name/electorate/party.

  async fetchRaw(): Promise<AphRaw> {
    const [senRes, memRes] = await Promise.all([
      fetch(SENATORS_CSV_URL, { headers: { "User-Agent": BROWSER_USER_AGENT } }),
      fetch(MEMBERS_CSV_URL, { headers: { "User-Agent": BROWSER_USER_AGENT } }),
    ]);
    if (!senRes.ok) throw new Error(`Failed to fetch senators CSV: ${senRes.status}`);
    if (!memRes.ok) throw new Error(`Failed to fetch members CSV: ${memRes.status}`);
    return {
      senatorsCsv: await senRes.text(),
      membersCsv: await memRes.text(),
      fetchedAt: fetchedAtNow(),
    };
  },

  normalize(raw: AphRaw): AphNormalized {
    const entities: Entity[] = [];
    const seats: Seat[] = [];
    const persons: Person[] = [];
    const terms: OfficeholderTerm[] = [];
    const relationships: Relationship[] = [];

    const dataSource = (url: string) => [
      { name: "Parliament of Australia (aph.gov.au)", url, fetchedAt: raw.fetchedAt },
    ];

    // --- Chamber entities -------------------------------------------------
    const houseEntity: Entity = {
      id: "au-chamber-house-of-representatives",
      slug: "house-of-representatives",
      type: "elected_office",
      name: "House of Representatives",
      branch: "legislative",
      description:
        "The lower house of the Parliament of Australia. 150 members, one per electorate, elected by preferential voting for terms of up to three years. The party or coalition commanding a majority of seats forms government.",
      legalSourceUrl: "https://www.legislation.gov.au/C1900A00001",
      officialWebsiteUrl: "https://www.aph.gov.au/About_Parliament/House_of_Representatives",
      iconShape: "circle",
      hierarchyLevel: 1,
      dataSource: dataSource(MEMBERS_CSV_URL),
    };
    const senateEntity: Entity = {
      id: "au-chamber-senate",
      slug: "senate",
      type: "elected_office",
      name: "Senate",
      branch: "legislative",
      description:
        "The upper house of the Parliament of Australia. 76 senators: 12 from each state and 2 from each mainland territory, elected by proportional representation, providing equal state representation regardless of population.",
      legalSourceUrl: "https://www.legislation.gov.au/C1900A00001",
      officialWebsiteUrl: "https://www.aph.gov.au/About_Parliament/Senate",
      iconShape: "circle",
      hierarchyLevel: 1,
      dataSource: dataSource(SENATORS_CSV_URL),
    };
    entities.push(houseEntity, senateEntity);

    const electsHouse: Relationship = {
      id: "au-rel-electors-elects-house",
      type: "elects",
      fromEntityId: "au-electors",
      toEntityId: houseEntity.id,
      description: "Electors in each of the 150 electorates directly elect their member.",
    };
    const electsSenate: Relationship = {
      id: "au-rel-electors-elects-senate",
      type: "elects",
      fromEntityId: "au-electors",
      toEntityId: senateEntity.id,
      description: "Electors in each state and territory directly elect their senators.",
    };
    relationships.push(electsHouse, electsSenate);

    const personIdCounts = new Map<string, number>();
    function makePersonId(surname: string, firstName: string): string {
      const base = `au-person-${slugify(`${firstName}-${surname}`)}`;
      const count = personIdCounts.get(base) ?? 0;
      personIdCounts.set(base, count + 1);
      return count === 0 ? base : `${base}-${count + 1}`;
    }

    function makeMinisterEntity(title: string, personId: string, seatIndex: number): {
      entity: Entity;
      seat: Seat;
      term: OfficeholderTerm;
      appointsRel: Relationship;
    } {
      const slug = slugify(title);
      const entityId = `au-exec-${slug}`;
      const entity: Entity = {
        id: entityId,
        slug,
        type: "executive_office",
        name: title,
        branch: "executive",
        description: `${title} in the Commonwealth Government, holding office at the pleasure of the Governor-General on the advice of the Prime Minister.`,
        legalSourceUrl: "https://www.legislation.gov.au/C1900A00001",
        iconShape: "hexagon",
        hierarchyLevel: title === "Prime Minister" || title === "Deputy Prime Minister" ? 2 : 3,
        dataSource: dataSource(MEMBERS_CSV_URL),
      };
      const seat: Seat = {
        id: `au-seat-${slug}`,
        entityId,
        label: title,
        seatIndex: 1,
        totalSeats: 1,
      };
      const appointsRel: Relationship = {
        id: `au-rel-appoints-${slug}-${seatIndex}`,
        type: "appoints",
        fromEntityId: "au-governor-general",
        toEntityId: entityId,
        description:
          "Formally appointed by the Governor-General under s64 of the Constitution, by convention on the advice of the Prime Minister.",
      };
      const term: OfficeholderTerm = {
        id: `au-term-${slug}`,
        seatId: seat.id,
        personId,
        startDate: "2025-05-12",
        endDate: null,
        installingRelationshipId: appointsRel.id,
        sourceUrl: MEMBERS_CSV_URL,
        confidence: "confirmed",
        predecessorTermId: null,
        predecessorUnknownReason: "pre-launch-gap",
      };
      return { entity, seat, term, appointsRel };
    }

    let ministerSeatIndex = 0;

    // --- Senators -----------------------------------------------------
    const senatorRows = parse(raw.senatorsCsv, {
      columns: true,
      skip_empty_lines: true,
    }) as SenatorRow[];

    senatorRows.forEach((row, i) => {
      const personId = makePersonId(row.Surname, row["First Name"]);
      const person: Person = {
        name: `${row["First Name"]} ${row.Surname}`.trim(),
        id: personId,
        partyAffiliation: row["Political Party"] || undefined,
      };
      persons.push(person);

      const seat: Seat = {
        id: `au-seat-senate-${slugify(row.State)}-${i + 1}`,
        entityId: senateEntity.id,
        label: `Senator for ${row.State}`,
        seatIndex: i + 1,
        totalSeats: senatorRows.length,
        jurisdiction: row.State,
      };
      seats.push(seat);

      const term: OfficeholderTerm = {
        id: `au-term-${seat.id}`,
        seatId: seat.id,
        personId,
        startDate: "2025-05-12",
        endDate: null,
        installingRelationshipId: electsSenate.id,
        sourceUrl: SENATORS_CSV_URL,
        confidence: "confirmed",
        predecessorTermId: null,
        predecessorUnknownReason: "pre-launch-gap",
      };
      terms.push(term);

      const { titles } = splitMinisterialTitles(row["Parliamentary Titles"] ?? "");
      for (const title of titles) {
        ministerSeatIndex += 1;
        const { entity, seat: minSeat, term: minTerm, appointsRel } = makeMinisterEntity(
          title,
          personId,
          ministerSeatIndex,
        );
        entities.push(entity);
        seats.push(minSeat);
        terms.push(minTerm);
        relationships.push(appointsRel);
      }
    });

    // --- Members (House of Representatives) ----------------------------
    const memberRows = parse(raw.membersCsv, {
      columns: true,
      skip_empty_lines: true,
    }) as MemberRow[];

    memberRows.forEach((row, i) => {
      const personId = makePersonId(row.Surname, row["First Name"]);
      const person: Person = {
        id: personId,
        name: `${row["First Name"]} ${row.Surname}`.trim(),
        partyAffiliation: row["Political Party"] || undefined,
      };
      persons.push(person);

      const seat: Seat = {
        id: `au-seat-house-${slugify(row.Electorate)}`,
        entityId: houseEntity.id,
        label: `Member for ${row.Electorate}`,
        seatIndex: i + 1,
        totalSeats: memberRows.length,
        jurisdiction: row.Electorate,
      };
      seats.push(seat);

      const term: OfficeholderTerm = {
        id: `au-term-${seat.id}`,
        seatId: seat.id,
        personId,
        startDate: "2025-05-12",
        endDate: null,
        installingRelationshipId: electsHouse.id,
        sourceUrl: MEMBERS_CSV_URL,
        confidence: "confirmed",
        predecessorTermId: null,
        predecessorUnknownReason: "pre-launch-gap",
      };
      terms.push(term);

      const { titles } = splitMinisterialTitles(row["Ministerial Title"] ?? "");
      for (const title of titles) {
        ministerSeatIndex += 1;
        const { entity, seat: minSeat, term: minTerm, appointsRel } = makeMinisterEntity(
          title,
          personId,
          ministerSeatIndex,
        );
        entities.push(entity);
        seats.push(minSeat);
        terms.push(minTerm);
        relationships.push(appointsRel);
      }
    });

    return { entities, seats, persons, terms, relationships };
  },
};
