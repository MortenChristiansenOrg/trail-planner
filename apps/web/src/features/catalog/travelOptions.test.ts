import { describe, expect, it } from "vitest";
import { deriveTravelOptionTotals } from "@trail-planner/domain";
import { destinationById } from "./catalog";
import { createDrivingOption, createInnsbruckDrivingOption, innsbruckDrivingOptionId } from "./travelOptions";

describe("provider-backed catalog travel options", () => {
  it("gives every available driving estimate a loadable option id", () => {
    for (const destination of destinationById.values()) {
      const estimate = destination.travel.find((item) => item.mode === "car");
      expect(estimate, destination.name).toBeDefined();
      if (estimate?.available) expect(estimate.optionId, destination.name).toBeTruthy();
    }
  });

  it("keeps the Innsbruck digest aligned with an OSRM road option", () => {
    const route = {
      coordinates: [[9.922, 57.048], [11.404, 47.269]] as [number, number][],
      distanceKm: 1_300,
      durationMinutes: 810,
      sourceUrl: "https://router.project-osrm.org/route/v1/driving/example",
    };
    const option = createInnsbruckDrivingOption(route, { ...route, coordinates: [...route.coordinates].reverse() }, "2026-07-18T10:00:00Z");
    const estimate = destinationById.get("innsbruck")!.travel.find((item) => item.mode === "car")!;

    expect(estimate.optionId).toBe(innsbruckDrivingOptionId);
    expect(option.outbound.stages[0].geometry).toEqual(route.coordinates);
    expect(deriveTravelOptionTotals(option)).toMatchObject({ durationMinutes: 1_620, cost: { amount: estimate.costPerPersonDkk } });
  });

  it("keeps one-direction route provenance when the other direction falls back", () => {
    const route = {
      coordinates: [[9.922, 57.048], [12.983, 47.633]] as [number, number][],
      distanceKm: 1_200,
      durationMinutes: 720,
      sourceUrl: "https://router.project-osrm.org/route/v1/driving/example",
    };
    const option = createDrivingOption({
      destinationId: "berchtesgaden",
      destinationName: "Berchtesgaden",
      destinationCoordinates: [12.983, 47.633],
      oneWayHours: 12.3,
      costPerPersonDkk: 1_800,
      viaSouthernDenmark: true,
    }, route);

    expect(option.outbound.stages[0]).toMatchObject({ durationMinutes: 720, confidence: "high", geometry: route.coordinates });
    expect(option.return.stages[0]).toMatchObject({ durationMinutes: 738, confidence: "medium" });
    expect(option.source.provider).toBe("OSRM + saved Explore catalog estimate");
    expect(option.warnings).toContain("Live road geometry could not be refreshed for one direction, so its saved Explore duration estimate is shown.");
  });
});
