import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const aalborgPreferences = {
  version: 1,
  homeCity: {
    key: "aalborg",
    name: "Aalborg",
    countryCode: "DK" as const,
    coordinates: [9.9217, 57.0488] as [number, number],
  },
  vehicle: {
    version: 1,
    powertrain: "ev" as const,
    consumptionPer100Km: 20,
    energyPricePerUnit: 2.5,
  },
};

describe("preference authorization", () => {
  test("rejects anonymous reads and writes", async () => {
    const t = convexTest(schema, modules);

    await expect(t.query(api.preferences.current, {})).rejects.toThrow(
      "Not authenticated",
    );
    await expect(
      t.mutation(api.preferences.upsert, aalborgPreferences),
    ).rejects.toThrow("Not authenticated");
  });

  test("isolates preference reads and writes by authenticated owner", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "clerk-alice", name: "Alice" });
    const bob = t.withIdentity({ subject: "clerk-bob", name: "Bob" });

    await alice.mutation(api.preferences.upsert, aalborgPreferences);
    expect(await alice.query(api.preferences.current, {})).toEqual(
      aalborgPreferences,
    );
    expect(await bob.query(api.preferences.current, {})).toBeNull();

    const copenhagenPreferences = {
      ...aalborgPreferences,
      homeCity: {
        key: "copenhagen",
        name: "Copenhagen",
        countryCode: "DK" as const,
        coordinates: [12.5683, 55.6761] as [number, number],
      },
    };
    await bob.mutation(api.preferences.upsert, copenhagenPreferences);

    expect(await bob.query(api.preferences.current, {})).toEqual(
      copenhagenPreferences,
    );
    expect(await alice.query(api.preferences.current, {})).toEqual(
      aalborgPreferences,
    );
  });

  test("rejects a client-supplied location outside the bounded city catalog", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ subject: "clerk-user" });

    await expect(
      user.mutation(api.preferences.upsert, {
        ...aalborgPreferences,
        homeCity: {
          ...aalborgPreferences.homeCity,
          key: "private-address",
          name: "Private address",
          coordinates: [9.9, 57],
        },
      }),
    ).rejects.toThrow("official Danish city catalog");
  });

  test("accepts a source-backed city outside the legacy shortlist", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ subject: "clerk-user" });
    const preferences = {
      ...aalborgPreferences,
      homeCity: {
        key: "12337669-a143-6b98-e053-d480220a5a3f",
        name: "Aalborg",
        countryCode: "DK" as const,
        municipality: "Aalborg",
        coordinates: [9.90549995, 57.03189109] as [number, number],
      },
    };

    await expect(
      user.mutation(api.preferences.upsert, preferences),
    ).resolves.toEqual(preferences);
  });

  test("rejects invalid charging-plan combinations", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ subject: "clerk-user" });

    await expect(
      user.mutation(api.preferences.upsert, {
        ...aalborgPreferences,
        vehicle: {
          ...aalborgPreferences.vehicle,
          powertrain: "petrol",
          chargingPlan: { name: "Old EV plan", pricePerKwh: 1 },
        },
      }),
    ).rejects.toThrow("Charging plans require an electric vehicle");

    await expect(
      user.mutation(api.preferences.upsert, {
        ...aalborgPreferences,
        vehicle: {
          ...aalborgPreferences.vehicle,
          chargingPlan: { name: "   ", pricePerKwh: 1 },
        },
      }),
    ).rejects.toThrow("non-blank name");
  });
});
