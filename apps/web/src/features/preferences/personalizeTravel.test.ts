import {
  createDefaultPreferences,
  getDanishCity,
} from "@trail-planner/domain";
import { describe, expect, test } from "vitest";
import type { Destination } from "@/features/catalog/catalog";
import {
  personalizeDestinations,
  travelEstimateTotal,
} from "./personalizeTravel";

const destination: Destination = {
  id: "test-mountain",
  aliases: [],
  name: "Test Mountain",
  region: "Test",
  country: "Norway",
  countryCode: "NO",
  coordinates: [8, 61],
  recommendedMonths: [7],
  summary: "Test",
  character: "Test",
  travel: [
    {
      mode: "car",
      available: true,
      accessNode: "Road",
      oneWayHours: 10,
      costPerPersonDkk: 2_000,
      note: "Baseline",
      confidence: "medium",
    },
  ],
  hikes: [],
  hikeCount: 5,
  lodgings: [],
  catalogVersion: "test-version",
  media: {
    imageUrl: "/catalog-media/test.jpg",
    assetSha256: "0".repeat(64),
    width: 1,
    height: 1,
    alt: "Test mountain",
    subject: "destination",
    kind: "terrain",
    creator: "Test",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attributionText: "Test · CC0",
    attributionUrl: "https://example.com/photo",
    sourceUrl: "https://example.com/photo",
    verifiedAt: "2026-07-25",
  },
  provenance: {
    sourceUrl: "https://example.com",
    verifiedAt: "2026-07-25",
    confidence: "medium",
  },
};

describe("personalized travel", () => {
  test("changes car cost when the vehicle or charging plan changes", () => {
    const aalborg = getDanishCity("aalborg")!;
    const base = createDefaultPreferences(aalborg);
    const cheapCharging = {
      ...base,
      vehicle: {
        ...base.vehicle,
        chargingPlan: { name: "Home", pricePerKwh: 1 },
      },
    };
    const expensive = personalizeDestinations([destination], base)[0].travel[0];
    const cheap = personalizeDestinations([destination], cheapCharging)[0].travel[0];

    expect(cheap.costPerPersonDkk).toBeLessThan(expensive.costPerPersonDkk);
    expect(cheap.optionId).not.toBe(expensive.optionId);
    expect(cheap.costBreakdown?.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "energy" }),
      ]),
    );
    expect(expensive.costBreakdown?.components).toHaveLength(1);
  });

  test("uses group pricing for a car", () => {
    const preferences = createDefaultPreferences(getDanishCity("aalborg")!);
    const estimate = personalizeDestinations([destination], preferences)[0].travel[0];

    expect(estimate.pricingBasis).toBe("per-group");
    expect(travelEstimateTotal(estimate, 4)).toBe(estimate.costPerPersonDkk);
  });

  test("rekeys and reranks inputs when the origin changes", () => {
    const aalborg = createDefaultPreferences(getDanishCity("aalborg")!);
    const copenhagen = createDefaultPreferences(getDanishCity("copenhagen")!);
    const fromAalborg = personalizeDestinations([destination], aalborg)[0].travel[0];
    const fromCopenhagen = personalizeDestinations([destination], copenhagen)[0].travel[0];

    expect(fromCopenhagen.origin?.name).toBe("Copenhagen");
    expect(fromCopenhagen.oneWayHours).not.toBe(fromAalborg.oneWayHours);
    expect(fromCopenhagen.optionId).not.toBe(fromAalborg.optionId);
  });
});
