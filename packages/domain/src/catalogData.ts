import type { ConfidenceLevel } from "./provenance";

export const catalogDataDomains = [
  "destination-core",
  "seasonality",
  "access",
  "hikes",
  "hike-geometry",
  "lodging",
  "travel-road",
  "travel-transit",
  "travel-flight",
  "media",
] as const;

export type CatalogDataDomain = (typeof catalogDataDomains)[number];

export const coverageStatuses = ["missing", "partial", "fresh", "stale", "unavailable"] as const;
export const sourceKinds = ["official", "open-data", "provider", "community", "manual"] as const;

export type CoverageStatus = (typeof coverageStatuses)[number];
export type EnrichmentTask = "add-destination" | "refresh-data";
export type EnrichmentStatus = "queued" | "running" | "completed" | "failed";
export type SourceKind = (typeof sourceKinds)[number];

export const catalogMediaLicenses = [
  "CC BY 2.0",
  "CC BY 2.5",
  "CC BY 3.0",
  "CC BY 4.0",
  "CC BY-SA 2.0",
  "CC BY-SA 2.5",
  "CC BY-SA 3.0",
  "CC BY-SA 4.0",
  "CC0",
  "Public domain",
] as const;

export const hikeDifficulties = ["Easy", "Moderate", "Hard", "Expert"] as const;
export const hikeRouteTypes = ["out-and-back", "loop", "point-to-point", "multi-day"] as const;

export type CatalogMediaLicense = (typeof catalogMediaLicenses)[number];
export type HikeDifficulty = (typeof hikeDifficulties)[number];
export type HikeRouteType = (typeof hikeRouteTypes)[number];

export type CatalogProvenanceSummary = {
  sourceKey: string;
  sourceUrl: string;
  verifiedAt: string;
  confidence: ConfidenceLevel;
};

export type CatalogHeroMedia = {
  imageUrl: string;
  assetSha256: string;
  width: number;
  height: number;
  alt: string;
  subject: "destination";
  kind: "terrain";
  creator: string;
  license: CatalogMediaLicense;
  licenseUrl: string;
  attributionText: string;
  attributionUrl: string;
  sourceUrl: string;
  verifiedAt: string;
};

export type CatalogGuide = {
  highlights: string;
  terrain: string;
  expectations: string;
};

export type CatalogHike = {
  key: string;
  name: string;
  routeType: HikeRouteType;
  description: string;
  difficulty: HikeDifficulty;
  durationHours: number;
  durationDays: number;
  distanceKm?: number;
  ascentM?: number;
  descentM?: number;
  trailhead: string;
  recommendedMonths?: number[];
  accessCaveat?: string;
  geometry?: {
    coordinates: [number, number][];
    sourceUrl: string;
    attribution: string;
    retrievedAt: string;
    sourceObjectId?: string;
  };
  provenance: CatalogProvenanceSummary;
};

export type CatalogTravelEstimate = {
  mode: "car" | "train" | "plane";
  available: boolean;
  accessNode: string;
  oneWayHours: number;
  costPerPersonDkk: number;
  layovers?: number;
  note: string;
  confidence: ConfidenceLevel;
  optionId?: string;
};

export type CatalogLodging = {
  id: string;
  name: string;
  kind: "hut" | "camping";
  nightlyCostDkk: number;
};

export type CatalogDestinationDigest = {
  destinationKey: string;
  aliases: string[];
  name: string;
  region: string;
  country: string;
  countryCode: string;
  coordinates: [number, number];
  recommendedMonths: number[];
  summary: string;
  character: string;
  provenance: CatalogProvenanceSummary;
  hero: CatalogHeroMedia;
  hikeCount: number;
  travel: CatalogTravelEstimate[];
  lodgings: CatalogLodging[];
  catalogVersion: string;
};

export type CatalogDestinationDetail = {
  destinationKey: string;
  guide: CatalogGuide;
  hero: CatalogHeroMedia;
  hikes: CatalogHike[];
  provenance: CatalogProvenanceSummary[];
  catalogVersion: string;
};

export type CatalogCoverageReportEntry = {
  destinationKey: string;
  visible: boolean;
  ready: boolean;
  guideWords: number;
  hikeCount: number;
  difficultyCount: number;
  durationBandCount: number;
  hasHero: boolean;
  gaps: string[];
};

export type CatalogClaim = {
  destinationKey: string;
  domain: CatalogDataDomain;
  subjectKey: string;
  field: string;
  valueJson: string;
  sourceKey: string;
  sourceUrl: string;
  retrievedAt: number;
  observedAt?: number;
  expiresAt?: number;
  confidence: ConfidenceLevel;
  runId: string;
  notes?: string;
};

export type DataCoverage = {
  destinationKey: string;
  domain: CatalogDataDomain;
  status: CoverageStatus;
  claimCount: number;
  assessedAt: number;
  staleAt?: number;
  reasons: string[];
  runId?: string;
};

export function isClaimStale(claim: Pick<CatalogClaim, "expiresAt">, now = Date.now()) {
  return claim.expiresAt !== undefined && claim.expiresAt <= now;
}

export function summarizeCoverage(
  destinationKey: string,
  domain: CatalogDataDomain,
  claims: CatalogClaim[],
  now = Date.now(),
): DataCoverage {
  const published = claims.filter((claim) => claim.destinationKey === destinationKey && claim.domain === domain);
  if (!published.length) {
    return { destinationKey, domain, status: "missing", claimCount: 0, assessedAt: now, reasons: ["No published claims"] };
  }
  const stale = published.filter((claim) => isClaimStale(claim, now));
  const staleAt = published.map((claim) => claim.expiresAt).filter((value): value is number => value !== undefined).sort((a, b) => a - b)[0];
  return {
    destinationKey,
    domain,
    status: stale.length ? "stale" : "fresh",
    claimCount: published.length,
    assessedAt: now,
    staleAt,
    reasons: stale.length ? [`${stale.length} published claim${stale.length === 1 ? " is" : "s are"} stale`] : [],
  };
}
