import { describe, expect, it } from "vitest";
import {
  destinations,
  destinationWithDetail,
  loadStaticCatalogDetail,
  staticCatalogVersion,
} from "./catalog";
import { responsiveImageUrl } from "./media";

describe("generated product catalog", () => {
  it("ships 26 bounded digests without guide prose or hikes", () => {
    expect(destinations).toHaveLength(26);
    expect(new Set(destinations.map((destination) => destination.id)).size).toBe(26);
    expect(destinations.every((destination) => destination.hikes.length === 0)).toBe(true);
    expect(destinations.every((destination) => destination.guide === undefined)).toBe(true);
    expect(destinations.every((destination) => destination.hikeCount >= 5)).toBe(true);
    expect(destinations.every((destination) => destination.catalogVersion === staticCatalogVersion)).toBe(true);
    expect(destinations.every((destination) => destination.travel.length === 3)).toBe(true);
  });

  it("lazy-loads the matching guide and five or more source-backed hikes", async () => {
    const digest = destinations.find((destination) => destination.id === "abisko")!;
    const detail = await loadStaticCatalogDetail("abisko");
    expect(detail).not.toBeNull();
    const destination = destinationWithDetail(digest, detail!);

    const guideSections = Object.values(destination.guide ?? {});
    expect(guideSections).toHaveLength(3);
    expect(guideSections.every((section) => section.split(/\s+/u).length >= 80)).toBe(true);
    expect(destination.hikes.length).toBeGreaterThanOrEqual(5);
    expect(new Set(destination.hikes.map((hike) => hike.difficulty)).size).toBeGreaterThanOrEqual(2);
    expect(destination.hikes.every((hike) => hike.provenance.sourceUrl.startsWith("https://"))).toBe(true);
    expect(destination.hikes.every((hike) => hike.route.length === 0)).toBe(true);
  });

  it("rejects detail data from another catalog version", async () => {
    const destination = destinations[0];
    const detail = await loadStaticCatalogDetail(destination.id);
    expect(detail).not.toBeNull();
    expect(() => destinationWithDetail(destination, {
      ...detail!,
      catalogVersion: "different-version",
    })).toThrow(/version mismatch/);
  });

  it("builds width-specific image URLs", () => {
    expect(responsiveImageUrl("/catalog-media/abisko.jpg", 640)).toBe("/catalog-media/abisko.jpg?width=640");
    expect(responsiveImageUrl("https://example.test/photo?download=1", 960)).toBe("https://example.test/photo?download=1&width=960");
  });
});
