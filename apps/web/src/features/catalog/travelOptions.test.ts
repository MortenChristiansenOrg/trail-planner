import { describe, expect, it } from "vitest";
import { deriveTravelOptionTotals } from "@trail-planner/domain";
import { destinationById } from "./catalog";
import { zermattDirectFlightOption } from "./travelOptions";

describe("catalog travel option digests", () => {
  it("keeps the Zermatt flight digest aligned with its outbound stages", () => {
    const estimate = destinationById.get("zermatt")!.travel.find((item) => item.mode === "plane")!;
    const outboundMinutes = zermattDirectFlightOption.outbound.stages.reduce((sum, stage) => sum + stage.durationMinutes, 0);

    expect(estimate.optionId).toBe(zermattDirectFlightOption.id);
    expect(estimate.oneWayHours).toBeCloseTo(outboundMinutes / 60, 1);
    expect(deriveTravelOptionTotals(zermattDirectFlightOption).cost.amount).toBe(estimate.costPerPersonDkk);
  });
});
