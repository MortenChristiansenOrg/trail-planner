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
