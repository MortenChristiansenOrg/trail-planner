import { describe, expect, it } from "vitest";
import {
  getCatalogCarDurationMinutes,
  getCatalogFerryPart,
  getCatalogUnavailableReason,
  resolveCatalogCarJourney,
} from "./catalogTravelData";

describe("Explore catalog trip plans", () => {
  it("routes Gjendesheim through the reusable Hirtshals–Larvik ferry part", () => {
    const parts = resolveCatalogCarJourney("jotunheimen", "outbound");

    expect(parts.map(({ part }) => part.key)).toEqual([
      "road-aalborg-hirtshals",
      "color-line-hirtshals-larvik",
      "road-larvik-gjendesheim",
    ]);
    expect(getCatalogFerryPart("jotunheimen")).toMatchObject({ recommendedArrivalMinutes: 60 });
    expect(getCatalogCarDurationMinutes("jotunheimen")).toBe(665);
  });

  it("keeps unverified Norway travel modes explicitly unavailable", () => {
    expect(getCatalogUnavailableReason("jotunheimen", "train-bus")).toContain("not been verified");
    expect(getCatalogUnavailableReason("jotunheimen", "airplane")).toContain("not been verified");
  });
});
