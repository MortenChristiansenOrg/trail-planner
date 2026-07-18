import { describe, expect, it } from "vitest";
import { destinations } from "@/features/catalog/catalog";
import { defaultExploreSearch } from "@/features/explore/search";
import {
  addActivity,
  addCustomCost,
  applyLodgingChoice,
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

  it("rejects invalid cost inputs", () => {
    expect(() => addCustomCost(makeTrip(), "Refund", -1)).toThrow(/Custom cost/);
    expect(() => addCustomCost(makeTrip(), "Unknown", Number.NaN)).toThrow(/Custom cost/);
    expect(() => calculateTripCost({
      ...makeTrip(),
      nights: [{ afterDay: 1, kind: "other", name: "Invalid", costDkk: Number.POSITIVE_INFINITY }],
    })).toThrow(/Lodging cost/);
  });

  it("copies lodging to remaining unplanned nights without replacing planned nights", () => {
    const trip = makeTrip();
    const withPlannedNight = {
      ...trip,
      nights: trip.nights.map((night) => night.afterDay === 2
        ? { ...night, kind: "tent-camping" as const, name: "Existing camp", costDkk: 250 }
        : night),
    };
    const applied = applyLodgingChoice(withPlannedNight, {
      afterDay: 1,
      kind: "known",
      name: "Mountain hut",
      costDkk: 700,
      knownLodgingId: "hut-1",
    }, "remaining-unplanned");

    expect(applied.nights.map(({ afterDay, kind, name }) => ({ afterDay, kind, name }))).toEqual([
      { afterDay: 1, kind: "known", name: "Mountain hut" },
      { afterDay: 2, kind: "tent-camping", name: "Existing camp" },
      { afterDay: 3, kind: "known", name: "Mountain hut" },
      { afterDay: 4, kind: "known", name: "Mountain hut" },
    ]);
  });

  it("explicitly overwrites every night while preserving identities and editability", () => {
    const trip = makeTrip();
    const applied = applyLodgingChoice(trip, {
      afterDay: 2,
      kind: "tent-free",
      name: "Wild tent",
      costDkk: 0,
    }, "all");
    const edited = applyLodgingChoice(applied, {
      ...applied.nights[2],
      kind: "other",
      name: "One-off cabin",
      costDkk: 450,
    });

    expect(applied.nights.map((night) => night.afterDay)).toEqual([1, 2, 3, 4]);
    expect(new Set(applied.nights).size).toBe(applied.nights.length);
    expect(edited.nights[2].name).toBe("One-off cabin");
    expect(edited.nights.filter((night) => night.name === "Wild tent")).toHaveLength(3);
  });
});
