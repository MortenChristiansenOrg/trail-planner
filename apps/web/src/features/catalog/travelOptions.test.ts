import { describe, expect, it } from "vitest";
import { deriveTravelOptionTotals } from "@trail-planner/domain";
import { destinationById } from "./catalog";
import { createInnsbruckDrivingOption, innsbruckDrivingOptionId } from "./travelOptions";

describe("provider-backed catalog travel options", () => {
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
});
