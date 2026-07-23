import { afterEach, describe, expect, it, vi } from "vitest";
import { deriveTravelOptionTotals } from "@trail-planner/domain";
import { destinationById } from "./catalog";
import { loadTravelOption } from "./travelOptionLoader";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("catalog travel option loading", () => {
  it("loads Berchtesgaden details from the same road provider used by Explore", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const points = new URL(String(input)).pathname
        .split("/driving/")[1]
        .split(";")
        .map((point) => point.split(",").map(Number) as [number, number]);
      return new Response(JSON.stringify({
        code: "Ok",
        routes: [{
          distance: 1_200_000,
          duration: 43_200,
          geometry: { coordinates: points },
        }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));
    const estimate = destinationById.get("berchtesgaden")!.travel.find(({ mode }) => mode === "car")!;

    const option = await loadTravelOption(estimate.optionId!);

    expect(option?.label).toBe("Drive from Aalborg to Berchtesgaden");
    expect(option?.outbound.stages[0].geometry).toHaveLength(3);
    expect(option?.return.stages[0].geometry).toHaveLength(3);
    expect(deriveTravelOptionTotals(option!)).toMatchObject({
      durationMinutes: 1_440,
      cost: { amount: estimate.costPerPersonDkk, currency: "DKK" },
    });
  });

  it("still returns complete driving stages when road geometry cannot be refreshed", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("routing unavailable");
    }));
    const estimate = destinationById.get("chamonix")!.travel.find(({ mode }) => mode === "car")!;

    const option = await loadTravelOption(estimate.optionId!);

    expect(option?.outbound.stages).toHaveLength(1);
    expect(option?.return.stages).toHaveLength(1);
    expect(option?.outbound.stages[0]).toMatchObject({
      kind: "car",
      durationMinutes: Math.round(estimate.oneWayHours * 60),
    });
    expect(option?.outbound.stages[0].geometry).toBeUndefined();
    expect(option?.warnings).toContain("Live road geometry could not be refreshed, so the saved Explore duration estimate is shown.");
  });
});
