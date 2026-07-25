import { describe, expect, test } from "vitest";
import {
  calculateCarCost,
  createDefaultPreferences,
  getDanishCity,
  preferenceCacheKey,
} from "./preferences";

describe("vehicle preferences", () => {
  test("converts EV consumption and a charging plan into itemized cost", () => {
    const estimate = calculateCarCost(1_000, {
      version: 1,
      powertrain: "ev",
      consumptionPer100Km: 20,
      energyPricePerUnit: 3,
      chargingPlan: { name: "Home charging", pricePerKwh: 2 },
      tollsDkk: 100,
      ferriesDkk: 300,
      parkingDkk: 50,
    });

    expect(estimate.totalDkk).toBe(850);
    expect(estimate.pricePerKmDkk).toBe(0.85);
    expect(estimate.components).toEqual([
      expect.objectContaining({ kind: "energy", amountDkk: 400 }),
      expect.objectContaining({ kind: "tolls", amountDkk: 100 }),
      expect.objectContaining({ kind: "ferries", amountDkk: 300 }),
      expect.objectContaining({ kind: "parking", amountDkk: 50 }),
    ]);
    expect(estimate.assumptions).toContain("2 DKK/kWh via Home charging");
  });

  test("supports petrol, diesel, and a direct per-kilometre override", () => {
    const petrol = calculateCarCost(500, {
      version: 2,
      powertrain: "petrol",
      consumptionPer100Km: 6,
      energyPricePerUnit: 15,
      tollsDkk: 0,
      ferriesDkk: 0,
      parkingDkk: 0,
    });
    const overridden = calculateCarCost(500, {
      version: 3,
      powertrain: "diesel",
      consumptionPer100Km: 5,
      energyPricePerUnit: 14,
      costPerKmOverrideDkk: 1.25,
      tollsDkk: 0,
      ferriesDkk: 0,
      parkingDkk: 0,
    });

    expect(petrol.totalDkk).toBe(450);
    expect(overridden.totalDkk).toBe(625);
  });

  test("ignores stale charging-plan data for combustion profiles", () => {
    const petrol = {
      version: 2,
      powertrain: "petrol" as const,
      consumptionPer100Km: 6,
      energyPricePerUnit: 15,
      tollsDkk: 0,
      ferriesDkk: 0,
      parkingDkk: 0,
    };
    const stalePlan = {
      ...petrol,
      chargingPlan: { name: "Old EV plan", pricePerKwh: 1 },
    };

    expect(calculateCarCost(500, stalePlan)).toEqual(
      calculateCarCost(500, petrol),
    );
    expect(preferenceCacheKey({
      ...createDefaultPreferences(getDanishCity("aalborg")!),
      vehicle: stalePlan,
    })).toBe(preferenceCacheKey({
      ...createDefaultPreferences(getDanishCity("aalborg")!),
      vehicle: petrol,
    }));
  });

  test("keys estimates by normalized city and vehicle version", () => {
    const aalborg = getDanishCity("aalborg");
    expect(aalborg).toBeDefined();
    const preferences = createDefaultPreferences(aalborg!);

    expect(preferenceCacheKey(preferences)).toMatch(/^aalborg:v1-ev-/);
    expect(getDanishCity("not-a-danish-city")).toBeUndefined();
  });
});
