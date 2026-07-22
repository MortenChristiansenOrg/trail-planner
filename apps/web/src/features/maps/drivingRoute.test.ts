import { describe, expect, it } from "vitest";
import { assertRoadEndpointSnaps, selectBestRoadRouteCandidate } from "./drivingRoute";

const geometry = { coordinates: [[9, 57], [10, 58]] as [number, number][] };

describe("road-route candidate selection", () => {
  it("chooses the shortest modeled duration even when it is not the first route", () => {
    const result = selectBestRoadRouteCandidate([
      { distance: 300_000, duration: 18_000, geometry },
      { distance: 320_000, duration: 15_000, geometry },
    ]);

    expect(result.candidate.duration).toBe(15_000);
    expect(result.durationBasis).toBe("provider");
  });

  it("uses shortest distance and an explicit speed estimate when durations are absent", () => {
    const result = selectBestRoadRouteCandidate([
      { distance: 210_000, geometry },
      { distance: 140_000, geometry },
    ]);

    expect(result.candidate.distance).toBe(140_000);
    expect(result.durationSeconds).toBe(7_200);
    expect(result.durationBasis).toBe("distance-estimate");
  });

  it("rejects access-node snaps over one kilometre", () => {
    expect(() => assertRoadEndpointSnaps([{ distance: 252 }, { distance: 1_535 }])).toThrow(/1,?535 m/);
    expect(() => assertRoadEndpointSnaps([{ distance: 14 }, { distance: 979 }])).not.toThrow();
  });
});
