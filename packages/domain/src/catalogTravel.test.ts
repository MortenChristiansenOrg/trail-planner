import { describe, expect, it } from "vitest";
import { deriveCatalogJourneyDuration, validateCatalogTravelData, type CatalogTravelPartFile, type CatalogTripPlanFile } from "./catalogTravel";

const source = {
  key: "test-source",
  url: "https://example.com/route",
  kind: "official" as const,
  retrievedAt: "2026-07-22T14:25:53.000Z",
  refreshAfter: "2026-08-05T00:00:00.000Z",
};

const partFile: CatalogTravelPartFile = {
  schemaVersion: 1,
  parts: [{
    key: "test-ferry",
    kind: "ferry",
    origin: { key: "aalborg", name: "Aalborg", coordinates: [9.9, 57] },
    destination: { key: "norway", name: "Norway", coordinates: [10, 59] },
    durationMinutes: 180,
    recommendedArrivalMinutes: 60,
    operator: "Test operator",
    service: "Test service",
    bookingUrl: "https://example.com/book",
    confidence: "high",
    source,
  }],
};

const planFile: CatalogTripPlanFile = {
  schemaVersion: 1,
  plans: [{
    key: "aalborg-norway",
    destinationKey: "norway",
    originKey: "aalborg",
    modes: {
      car: { status: "available", outbound: [{ partKey: "test-ferry" }], return: [{ partKey: "test-ferry", reverse: true }] },
      "train-bus": { status: "details-unavailable", reason: "No complete itinerary." },
      airplane: { status: "details-unavailable", reason: "No complete itinerary." },
    },
  }],
};

describe("catalog travel data", () => {
  it("accepts a gap-free mode matrix with independently referenced parts", () => {
    expect(validateCatalogTravelData(partFile, planFile, ["norway"], new Map([["norway", "NO"]]))).toEqual([]);
    expect(deriveCatalogJourneyDuration(planFile.plans[0].modes.car.status === "available" ? planFile.plans[0].modes.car.outbound : [], partFile.parts)).toEqual({
      minimumMinutes: 240,
      maximumMinutes: 240,
    });
  });

  it("rejects journey gaps, omitted modes, and ferry parts without the arrival buffer", () => {
    const invalidParts = structuredClone(partFile);
    invalidParts.parts[0].recommendedArrivalMinutes = 15;
    const invalidPlans = structuredClone(planFile) as unknown as CatalogTripPlanFile;
    delete (invalidPlans.plans[0].modes as Partial<CatalogTripPlanFile["plans"][number]["modes"]>).airplane;
    invalidPlans.plans[0].modes.car = {
      status: "available",
      outbound: [{ partKey: "test-ferry", reverse: true }],
      return: [{ partKey: "test-ferry", reverse: true }],
    };

    const errors = validateCatalogTravelData(invalidParts, invalidPlans, ["norway"], new Map([["norway", "NO"]]));
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining("60-minute recommended arrival"),
      expect.stringContaining("explicitly cover every travel mode"),
      expect.stringContaining("leaves a gap"),
    ]));
  });

  it("rejects unknown runtime discriminators and invalid reference keys", () => {
    const invalidParts = structuredClone(partFile) as unknown as CatalogTravelPartFile;
    invalidParts.parts[0].kind = "boat" as "ferry";
    invalidParts.parts[0].confidence = "certain" as "high";
    invalidParts.parts[0].source.kind = "scraped" as "official";
    const invalidPlans = structuredClone(planFile) as unknown as CatalogTripPlanFile;
    invalidPlans.plans[0].modes.car = { status: "unknown" } as unknown as CatalogTripPlanFile["plans"][number]["modes"]["car"];

    expect(validateCatalogTravelData(invalidParts, invalidPlans, ["norway"])).toEqual(expect.arrayContaining([
      expect.stringContaining("invalid kind"),
      expect.stringContaining("invalid confidence"),
      expect.stringContaining("source is invalid"),
      expect.stringContaining("invalid status"),
    ]));
  });

  it("rejects non-boolean reverse flags and impossible source dates", () => {
    const invalidParts = structuredClone(partFile) as unknown as CatalogTravelPartFile;
    invalidParts.parts[0].source.retrievedAt = "2026-02-31T00:00:00.000Z";
    invalidParts.parts[0].source.refreshAfter = "2026-13-01T00:00:00.000Z";
    const invalidPlans = structuredClone(planFile) as unknown as CatalogTripPlanFile;
    invalidPlans.plans[0].modes.car = {
      status: "available",
      outbound: [{ partKey: "test-ferry" }],
      return: [{ partKey: "test-ferry", reverse: "false" as unknown as boolean }],
    };

    const errors = validateCatalogTravelData(invalidParts, invalidPlans, ["norway"]);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining("invalid reverse flag"),
      expect.stringContaining("source is invalid"),
    ]));
  });

  it("rejects provider routes that snap too far from a requested access node", () => {
    const invalidParts = structuredClone(partFile);
    invalidParts.parts[0].source.endpointSnapMeters = [12, 1_535];

    expect(validateCatalogTravelData(invalidParts, planFile, ["norway"])).toContainEqual(
      expect.stringContaining("snapped too far"),
    );
  });
});
