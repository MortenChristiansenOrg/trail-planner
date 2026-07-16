import { describe, expect, it } from "vitest";
import { destinations } from "@/features/catalog/catalog";
import {
  defaultExploreSearch,
  estimateFits,
  monthDistance,
  parseExploreSearch,
  rankDestinations,
} from "@/features/explore/search";

describe("explore search", () => {
  it("normalizes unsafe URL values", () => {
    expect(parseExploreSearch({ month: 25, participants: 1.6, days: "7.4", maxLayovers: 1.8, modes: "plane,bad" })).toMatchObject({
      month: 12,
      participants: 2,
      days: 7,
      maxLayovers: 2,
      modes: ["plane"],
    });
  });

  it("counts one-way travel time once in each direction", () => {
    expect(estimateFits({
      mode: "car",
      available: true,
      oneWayHours: 6,
      costPerPersonDkk: 500,
      note: "Test estimate",
      confidence: "high",
    }, { ...defaultExploreSearch, days: 3, participants: 1 })).toBe(true);
  });

  it("calculates season distance across the year boundary", () => {
    expect(monthDistance(12, [1, 2])).toBe(1);
    expect(monthDistance(7, [6, 7, 8])).toBe(0);
  });

  it("only ranks destinations with a viable selected transport mode", () => {
    const results = rankDestinations(destinations, {
      ...defaultExploreSearch,
      modes: ["plane"],
      maxLayovers: 0,
      maxFlightDkk: 2_000,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.viable.every((estimate) => estimate.mode === "plane"))).toBe(true);
    expect(results.every((result) => result.viable.every((estimate) => (estimate.layovers ?? 0) === 0))).toBe(true);
  });

  it("applies country and recommended-period filters together", () => {
    const strict = rankDestinations(destinations, {
      ...defaultExploreSearch,
      month: 4,
      countries: ["NO"],
      seasonTolerance: 0,
    });
    const relaxed = rankDestinations(destinations, {
      ...defaultExploreSearch,
      month: 4,
      countries: ["NO"],
      seasonTolerance: 2,
    });
    expect(strict).toHaveLength(0);
    expect(relaxed.length).toBeGreaterThan(0);
    expect(relaxed.every((result) => result.destination.countryCode === "NO")).toBe(true);
  });
});
