import type {
  Branch,
  ChangeEventType,
  ConfidenceLevel,
  EntityType,
  PredecessorUnknownReason,
  RelationshipType,
} from "./enums";

export interface DataSourceRef {
  name: string;
  url: string;
  license?: string;
  fetchedAt: string; // ISO date
}

export interface Entity {
  id: string;
  slug: string;
  type: EntityType;
  name: string;
  shortName?: string;
  branch: Branch;
  portfolio?: string; // e.g. "Treasury" for a dept/minister
  description: string; // prose, includes constitutional/legal basis
  legalBasisText?: string;
  legalSourceUrl?: string;
  officialWebsiteUrl?: string;
  abn?: string; // Australian Business Number, departments/agencies from AGOR
  agorClassification?: string;
  parentEntityId?: string; // hierarchy, e.g. Department -> Executive
  iconShape: string; // drives Legend + node rendering
  hierarchyLevel: number; // ring index, innermost = 0
  dataSource: DataSourceRef[];
}

export interface Seat {
  id: string;
  entityId: string; // FK: the body this seat belongs to
  label: string; // e.g. "Senator for Tasmania"
  seatIndex: number;
  totalSeats: number; // supports "7 of 7 seats" style UI
  jurisdiction?: string; // electorate / state-territory
}

export interface Person {
  id: string;
  name: string;
  photoUrl?: string;
  partyAffiliation?: string;
  bioShort?: string;
}

export interface OfficeholderTerm {
  id: string;
  seatId: string;
  personId: string;
  startDate: string;
  endDate: string | null; // null = current
  installingRelationshipId: string; // the "elects"/"appoints" edge that installed them
  sourceUrl: string;
  confidence: ConfidenceLevel;
  predecessorTermId: string | null;
  predecessorUnknownReason?: PredecessorUnknownReason;
}

export interface Relationship {
  id: string;
  type: RelationshipType;
  fromEntityId: string;
  toEntityId: string;
  description?: string;
  legalSourceUrl?: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  bodyMarkdown: string;
  publishedAt: string;
  sourceUrl: string;
  sourceName: string;
  relatedEntityIds: string[];
  thumbnailUrl?: string;
}

export interface ChangeEvent {
  id: string;
  type: ChangeEventType;
  seatId?: string;
  entityId?: string;
  predecessorTermId: string | null;
  successorTermId: string | null;
  occurredAt: string;
  detectedAt: string;
  sourceUrl: string;
  confidence: ConfidenceLevel;
}

export interface EntityAlias {
  id: string;
  entityId: string;
  alias: string;
}
