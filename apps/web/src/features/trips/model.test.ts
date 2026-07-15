import { describe, expect, it } from "vitest";
import { destinations } from "@/features/catalog/catalog";
import { defaultExploreSearch } from "@/features/explore/search";
import {
  addActivity,
  addCustomCost,
  applyStartDate,
  calculateTripCost,
  createTrip,
  removeActivityGroup,
} from "@/features/trips/model";

const destination = destinations[1];

function makeTrip() {
  return createTrip({
    destinationId: destination.id,
    destinationName: destination.name,
    search: defaultExploreSearch,
    travel: destination.travel,
  });
}

describe("planned trip model", () => {
  it("fills consecutive slots for a multi-day hike without replacing activities", () => {
    let trip = makeTrip();
    trip = addActivity(trip, 2, {
      kind: "catalog-hike",
      hikeId: "first",
      name: "First route",
      description: "One day",
      durationDays: 1,
    });
    trip = addActivity(trip, 2, {
      kind: "catalog-hike",
      hikeId: "multi",
      name: "Three-day route",
      description: "Several stages",
      durationDays: 3,
    });
    expect(trip.days[1].activities).toHaveLength(2);
    expect(trip.days[2].activities[0].segment).toBe(2);
    expect(trip.days[3].activities[0].segment).toBe(3);
  });

  it("removes every segment of one activity group", () => {
    const withActivity = addActivity(makeTrip(), 2, {
      kind: "custom-hike",
      name: "Traverse",
      description: "Personal route",
      durationDays: 2,
    });
    const groupId = withActivity.days[1].activities[0].groupId;
    const removed = removeActivityGroup(withActivity, groupId);
    expect(removed.days.flatMap((day) => day.activities)).toHaveLength(0);
  });

  it("updates dates, lodging, travel, and custom costs in the total", () => {
    let trip = makeTrip();
    trip = { ...trip, selectedTravelMode: "car" };
    trip = {
      ...trip,
      nights: trip.nights.map((night, index) => index === 0 ? { ...night, kind: "tent-camping", name: "Camp", costDkk: 300 } : night),
    };
    trip = addCustomCost(trip, "Food", 1_200);
    trip = applyStartDate(trip, "2026-07-10");
    const cost = calculateTripCost(trip);
    expect(cost.total).toBe(destination.travel[0].costPerPersonDkk * trip.participants + 1_500);
    expect(trip.days[1].calendarDate).toBe("2026-07-11");
  });
});
