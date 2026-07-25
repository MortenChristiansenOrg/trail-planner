import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import {
  catalogVersionForRecords,
  compileCatalog,
} from "./compile-catalog.mjs";
import { validateCatalogRecord } from "./validate-record.mjs";

const abisko = JSON.parse(await readFile("data/catalog/records/abisko.json", "utf8"));

describe("catalog compiler", () => {
  test("reproduces the checked-in artifacts without drift", async () => {
    const first = await compileCatalog({ check: true });
    const second = await compileCatalog({ check: true });

    expect(second.catalogVersion).toBe(first.catalogVersion);
    expect(first.expected).toEqual({ destinations: 26, hikes: 130, coverage: 47 });
  });

  test("accepts useful hidden records without exposing incomplete content", () => {
    const partial = structuredClone(abisko);
    partial.destination.key = "future-partial-hub";
    partial.destination.visibility = "hidden";
    partial.claims = partial.claims.filter((claim) => !["media", "hikes"].includes(claim.domain));
    partial.coverage = partial.coverage.map((coverage) => (
      ["media", "hikes"].includes(coverage.domain)
        ? { ...coverage, status: "missing", reasons: ["Not targeted in this run"] }
        : coverage
    ));

    expect(validateCatalogRecord(partial)).toEqual([]);
    expect(catalogVersionForRecords([abisko, partial])).not.toBe(catalogVersionForRecords([abisko]));
  });

  test("rejects an incomplete visible record", () => {
    const incomplete = structuredClone(abisko);
    incomplete.claims = incomplete.claims.filter((claim) => !(claim.domain === "hikes" && claim.field === "hike"));

    expect(validateCatalogRecord(incomplete)).toEqual(
      expect.arrayContaining([expect.stringMatching(/visible destination is not ready: hikes/)]),
    );
  });

  test("rejects incomplete guide, media attribution, and geometry provenance", () => {
    const incompleteGuide = structuredClone(abisko);
    incompleteGuide.claims.find((claim) => claim.field === "guide.highlights").value = "Too short.";
    expect(validateCatalogRecord(incompleteGuide)).toEqual(
      expect.arrayContaining([expect.stringMatching(/guide\.highlights/)]),
    );

    const incompleteMedia = structuredClone(abisko);
    incompleteMedia.claims.find((claim) => claim.field === "hero").value.license = "All rights reserved";
    expect(validateCatalogRecord(incompleteMedia)).toEqual(
      expect.arrayContaining([expect.stringMatching(/license is unsupported/)]),
    );

    const unsourcedGeometry = structuredClone(abisko);
    unsourcedGeometry.claims.find((claim) => claim.field === "hike").value.geometry = {
      coordinates: [[18.78, 68.35], [18.8, 68.36]],
    };
    expect(validateCatalogRecord(unsourcedGeometry)).toEqual(
      expect.arrayContaining([expect.stringMatching(/geometry provenance is incomplete/)]),
    );
  });

  test("changes the content address when a published claim is refreshed", () => {
    const refreshed = structuredClone(abisko);
    refreshed.claims.find((claim) => claim.field === "summary").value += " Updated.";

    expect(catalogVersionForRecords([refreshed])).not.toBe(catalogVersionForRecords([abisko]));
  });

  test("content addressing is independent of record enumeration order", () => {
    const second = structuredClone(abisko);
    second.destination.key = "second-record";
    expect(catalogVersionForRecords([abisko, second])).toBe(
      catalogVersionForRecords([second, abisko]),
    );
  });
});
