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
  setLodgingNight,
  setTripCostOverride,
  type PlannedTrip,
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
  it("gives catalog hikes distinct planning traces", () => {
    for (const area of destinations) {
      const serialized = area.hikes.map((hike) => JSON.stringify(hike.route));
      expect(new Set(serialized).size).toBe(serialized.length);
    }
  });

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

  it("rejects activities outside the trip and invalid durations", () => {
    const activity = {
      kind: "custom-hike" as const,
      name: "Traverse",
      description: "Personal route",
      durationDays: 1,
    };
    expect(() => addActivity(makeTrip(), 0, activity)).toThrow(/startDay/);
    expect(() => addActivity(makeTrip(), 2, { ...activity, durationDays: Number.NaN })).toThrow(/durationDays/);
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

  it("reuses the first available trail letter after an activity is removed", () => {
    let trip = addActivity(makeTrip(), 1, {
      kind: "custom-hike",
      name: "First",
      description: "First route",
      durationDays: 1,
    });
    const firstGroupId = trip.days[0].activities[0].groupId;
    trip = addActivity(trip, 2, {
      kind: "custom-hike",
      name: "Second",
      description: "Second route",
      durationDays: 1,
    });
    trip = removeActivityGroup(trip, firstGroupId);
    trip = addActivity(trip, 3, {
      kind: "custom-hike",
      name: "Replacement",
      description: "Replacement route",
      durationDays: 1,
    });

    expect(trip.days[1].activities[0].letter).toBe("B");
    expect(trip.days[2].activities[0].letter).toBe("A");
  });

  it("updates dates, lodging, travel, and custom costs in the total", () => {
    let trip = makeTrip();
    trip = { ...trip, selectedTravelMode: "car" };
    trip = setLodgingNight(trip, { afterDay: 1, kind: "tent-camping", name: "Camp", costDkk: 300 });
    trip = addCustomCost(trip, "Food", 1_200);
    trip = applyStartDate(trip, "2026-07-10");
    const cost = calculateTripCost(trip);
    expect(cost.total).toBe(destination.travel[0].costPerPersonDkk * trip.participants + 1_500);
    expect(trip.days[1].calendarDate).toBe("2026-07-11");
  });

  it("rejects invalid cost inputs", () => {
    expect(() => addCustomCost(makeTrip(), "Refund", -1)).toThrow(/Custom cost/);
    expect(() => addCustomCost(makeTrip(), "Unknown", Number.NaN)).toThrow(/Custom cost/);
    expect(() => setLodgingNight(makeTrip(), { afterDay: 1, kind: "other", name: "Invalid", costDkk: Number.POSITIVE_INFINITY })).toThrow(/Lodging cost/);
  });

  it("overrides and resets a leaf while retaining its calculated provider value", () => {
    let trip: PlannedTrip = { ...makeTrip(), selectedTravelMode: "car" };
    const estimate = calculateTripCost(trip);
    const travelItem = estimate.categories.find((category) => category.item.category === "travel")!.children[0];
    trip = setTripCostOverride(trip, travelItem.id, 4_200, "Updated crossing price");

    const overridden = calculateTripCost(trip);
    expect(overridden.travelCost).toBe(4_200);
    expect(overridden.items.find((item) => item.id === travelItem.id)?.calculatedCost.amount).toBe(destination.travel[0].costPerPersonDkk * trip.participants);
    expect(overridden.items.find((item) => item.id === travelItem.id)?.overrideNote).toBe("Updated crossing price");

    trip = setTripCostOverride(trip, travelItem.id);
    expect(calculateTripCost(trip).travelCost).toBe(estimate.travelCost);
  });

  it("uses a category override without double counting its children", () => {
    let trip: PlannedTrip = { ...makeTrip(), selectedTravelMode: "car" };
    trip = setLodgingNight(trip, { afterDay: 1, kind: "known", name: "Hut", costDkk: 600 });
    const before = calculateTripCost(trip);
    const lodgingCategory = before.categories.find((category) => category.item.category === "lodging")!;
    trip = setTripCostOverride(trip, lodgingCategory.item.id, 450, "Package rate");

    const overridden = calculateTripCost(trip);
    expect(overridden.lodgingCost).toBe(450);
    expect(overridden.total).toBe(before.total - 150);
    expect(overridden.perPerson).toBe(overridden.total / trip.participants);
  });

  it("preserves a lodging override when its underlying choice changes", () => {
    let trip = setLodgingNight(makeTrip(), { afterDay: 1, kind: "known", name: "Hut", costDkk: 600 });
    trip = setTripCostOverride(trip, "cost-lodging-1", 525, "Member rate");
    trip = setLodgingNight(trip, { afterDay: 1, kind: "other", name: "Cabin", costDkk: 800 });

    const item = calculateTripCost(trip).items.find((cost) => cost.id === "cost-lodging-1");
    expect(item?.calculatedCost.amount).toBe(800);
    expect(item?.overrideCost?.amount).toBe(525);
    expect(item?.overrideNote).toBe("Member rate");
  });

  it("rejects an invalid participant count", () => {
    const trip = makeTrip();
    expect(() => calculateTripCost({ ...trip, participants: 0 })).toThrow(/positive integer/);
  });
});
