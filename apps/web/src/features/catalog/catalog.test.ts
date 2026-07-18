import { describe, expect, it } from "vitest";
import { destinations, validateCatalog, type Destination } from "./catalog";
import { responsiveImageUrl } from "./media";

describe("catalog validation", () => {
  it("publishes multiple source-backed Icelandic and Swedish hubs", () => {
    const iceland = destinations.filter((destination) => destination.countryCode === "IS");
    const sweden = destinations.filter((destination) => destination.countryCode === "SE");

    expect(iceland.length).toBeGreaterThanOrEqual(4);
    expect(sweden.length).toBeGreaterThanOrEqual(4);
    expect(iceland.some((destination) => destination.hikes.length === 0)).toBe(true);
    expect(sweden.some((destination) => destination.hikes.length === 0)).toBe(true);
    expect(sweden.some((destination) => destination.hikes.length >= 2)).toBe(true);
    expect(destinations.every((destination) => destination.travel.every((estimate) => estimate.accessNode.trim()))).toBe(true);
    expect(destinations.flatMap((destination) => destination.hikes).every((hike) => !hike.route.length || hike.geometrySourceUrl)).toBe(true);
    expect(() => validateCatalog(destinations)).not.toThrow();
  });

  it("keeps official Kungsleden metrics separate from OSM geometry provenance", () => {
    const stages = destinations.find((destination) => destination.id === "abisko")!.hikes;
    expect(stages.map((stage) => stage.ascentM)).toEqual([100, 300]);
    expect(stages.every((stage) => stage.provenance.sourceUrl.includes("swedishtouristassociation.com"))).toBe(true);
    expect(stages.every((stage) => stage.geometrySourceUrl?.includes("openstreetmap.org/relation/"))).toBe(true);
  });

  it("rejects missing provenance and unknown media licenses", () => {
    const destination = destinations.find((item) => item.media)!;
    expect(() => validateCatalog([{ ...destination, provenance: { ...destination.provenance, sourceUrl: "" } }])).toThrow(/provenance/);
    expect(() => validateCatalog([{
      ...destination,
      media: { ...destination.media!, license: "All rights reserved" },
    } as unknown as Destination])).toThrow(/unsupported media license/);
    expect(() => validateCatalog([{
      ...destination,
      media: { ...destination.media!, subject: "hike" },
    }])).toThrow(/media subject/);
    expect(() => validateCatalog([{ ...destination, provenance: { ...destination.provenance, reviewedAt: "2026-02-31" } }])).toThrow(/provenance/);
  });

  it("rejects invalid provenance, travel, and media discriminators", () => {
    const destination = destinations.find((item) => item.media)!;
    expect(() => validateCatalog([{
      ...destination,
      provenance: { ...destination.provenance, confidence: undefined },
    } as unknown as Destination])).toThrow(/provenance confidence/);
    expect(() => validateCatalog([{
      ...destination,
      travel: destination.travel.map((estimate, index) => index === 0
        ? { ...estimate, confidence: "certain" }
        : estimate),
    } as unknown as Destination])).toThrow(/travel confidence/);
    expect(() => validateCatalog([{
      ...destination,
      media: { ...destination.media!, kind: "portrait" },
    } as unknown as Destination])).toThrow(/media kind/);
  });

  it("rejects invalid travel nodes and unsupported route geometry", () => {
    const destination = destinations.find((item) => item.hikes.length)!;
    const hike = destination.hikes[0];
    expect(() => validateCatalog([{
      ...destination,
      travel: destination.travel.map((estimate) => ({ ...estimate, mode: "car" })),
    }])).toThrow(/travel nodes/);
    expect(() => validateCatalog([{
      ...destination,
      hikes: [{ ...hike, route: [[7, 62], [7.1, 62.1]], geometrySourceUrl: undefined }],
    }])).toThrow(/geometry is missing provenance/);
    expect(() => validateCatalog([{
      ...destination,
      hikes: [{ ...hike, route: [[7, 62]] }],
    }])).toThrow(/at least two coordinates/);
  });

  it("builds width-specific Wikimedia image URLs", () => {
    expect(responsiveImageUrl("https://example.test/photo", 640)).toBe("https://example.test/photo?width=640");
    expect(responsiveImageUrl("https://example.test/photo?download=1", 960)).toBe("https://example.test/photo?download=1&width=960");
    expect(responsiveImageUrl("https://example.test/photo?download=1#credit", 480)).toBe("https://example.test/photo?download=1&width=480#credit");
  });
});
