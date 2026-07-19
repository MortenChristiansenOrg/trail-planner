import { describe, expect, it } from "vitest";
import { summarizeCoverage, type CatalogClaim } from "./catalogData";

const claim = (overrides: Partial<CatalogClaim> = {}): CatalogClaim => ({
  destinationKey: "innsbruck",
  domain: "travel-road",
  subjectKey: "innsbruck",
  field: "durationHours",
  valueJson: "13.5",
  sourceKey: "osrm",
  sourceUrl: "https://router.project-osrm.org/",
  retrievedAt: 1_000,
  confidence: "medium",
  runId: "run-1",
  ...overrides,
});

describe("catalog data coverage", () => {
  it("marks domains without published claims as missing", () => {
    expect(summarizeCoverage("innsbruck", "travel-road", [], 2_000)).toMatchObject({
      status: "missing",
      claimCount: 0,
    });
  });

  it("marks a domain stale when a published claim has expired", () => {
    expect(summarizeCoverage("innsbruck", "travel-road", [claim({ expiresAt: 1_500 })], 2_000)).toMatchObject({
      status: "stale",
      staleAt: 1_500,
    });
  });

  it("keeps published unexpired claims fresh", () => {
    expect(summarizeCoverage("innsbruck", "travel-road", [claim({ expiresAt: 2_500 })], 2_000)).toMatchObject({
      status: "fresh",
      claimCount: 1,
    });
  });
});
