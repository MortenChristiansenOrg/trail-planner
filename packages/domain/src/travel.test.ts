import { describe, expect, it } from "vitest";
import { deriveTravelOptionTotals, mapAmadeusOffer, type AmadeusOffer, type TravelOptionSnapshot } from "./travel";

const segment = (id: string, from: string, to: string, departure: string, arrival: string, duration: string, stops = 0) => ({
  id,
  departure: { iataCode: from, at: departure },
  arrival: { iataCode: to, at: arrival },
  carrierCode: "SK",
  number: id,
  duration,
  numberOfStops: stops,
});

describe("Amadeus travel adapter", () => {
  it("maps a direct return without creating layovers", () => {
    const offer: AmadeusOffer = {
      id: "direct",
      itineraries: [
        { duration: "PT2H", segments: [segment("101", "AAL", "INN", "2026-07-10T08:00:00Z", "2026-07-10T10:00:00Z", "PT2H")] },
        { duration: "PT2H10M", segments: [segment("102", "INN", "AAL", "2026-07-15T16:00:00Z", "2026-07-15T18:10:00Z", "PT2H10M")] },
      ],
      price: { grandTotal: "2900", currency: "DKK" },
    };
    const mapped = mapAmadeusOffer(offer, "2026-07-01T10:00:00Z");

    expect(mapped.outbound.stages.map((stage) => stage.kind)).toEqual(["flight"]);
    expect(mapped.outbound.stages[0].geometry).toBeUndefined();
    expect(mapped.pricingBasis).toBe("per-group");
    expect(deriveTravelOptionTotals(mapped)).toMatchObject({ durationMinutes: 250, layovers: 0, cost: { amount: 2900 } });
  });

  it("maps connections as layovers and keeps technical stops on their flight leg", () => {
    const offer: AmadeusOffer = {
      id: "connecting",
      itineraries: [
        { duration: "PT4H30M", segments: [
          segment("201", "AAL", "CPH", "2026-07-10T07:00:00Z", "2026-07-10T07:45:00Z", "PT45M", 1),
          segment("202", "CPH", "INN", "2026-07-10T09:00:00Z", "2026-07-10T11:30:00Z", "PT2H30M"),
        ] },
        { duration: "PT3H45M", segments: [
          segment("203", "INN", "CPH", "2026-07-15T14:00:00Z", "2026-07-15T16:00:00Z", "PT2H"),
          segment("204", "CPH", "AAL", "2026-07-15T17:00:00Z", "2026-07-15T17:45:00Z", "PT45M"),
        ] },
      ],
      price: { grandTotal: "3100", currency: "DKK" },
    };
    const mapped = mapAmadeusOffer(offer, "2026-07-01T10:00:00Z");

    expect(mapped.outbound.stages.map((stage) => stage.kind)).toEqual(["flight", "transfer", "flight"]);
    expect(mapped.outbound.stages[1]).toMatchObject({ origin: { name: "CPH" }, destination: { name: "CPH" }, durationMinutes: 75 });
    expect(mapped.outbound.stages[0].technicalStops).toEqual(["1 provider-reported technical stop"]);
    expect(deriveTravelOptionTotals(mapped)).toMatchObject({ layovers: 1, returnLayovers: 1 });
  });

  it("rejects blank prices and duration tokens", () => {
    const offer: AmadeusOffer = {
      id: "invalid",
      itineraries: [
        { duration: "PT", segments: [segment("101", "AAL", "INN", "2026-07-10T08:00:00Z", "2026-07-10T10:00:00Z", "PT")] },
        { duration: "PT2H", segments: [segment("102", "INN", "AAL", "2026-07-15T16:00:00Z", "2026-07-15T18:00:00Z", "PT2H")] },
      ],
      price: { grandTotal: "", currency: "DKK" },
    };
    expect(() => mapAmadeusOffer(offer, "2026-07-01T10:00:00Z")).toThrow(/price/);
    expect(() => mapAmadeusOffer({ ...offer, price: { grandTotal: "2900", currency: "DKK" } }, "2026-07-01T10:00:00Z")).toThrow(/duration/);
  });

  it.each([-1, 1.5, Number.NaN])("rejects an invalid technical-stop count of %s", (numberOfStops) => {
    const offer: AmadeusOffer = {
      id: "invalid-stops",
      itineraries: [
        { duration: "PT2H", segments: [segment("101", "AAL", "INN", "2026-07-10T08:00:00Z", "2026-07-10T10:00:00Z", "PT2H", numberOfStops)] },
        { duration: "PT2H", segments: [segment("102", "INN", "AAL", "2026-07-15T16:00:00Z", "2026-07-15T18:00:00Z", "PT2H")] },
      ],
      price: { grandTotal: "2900", currency: "DKK" },
    };

    expect(() => mapAmadeusOffer(offer, "2026-07-01T10:00:00Z")).toThrow(/technical-stop count/);
  });
});

describe("provider-independent travel totals", () => {
  it("derives both directions for a mixed-mode option and reconciles each cost once", () => {
    const option: TravelOptionSnapshot = {
      id: "mixed",
      label: "Rail and bus",
      priceType: "estimated",
      pricingBasis: "per-person",
      outbound: { direction: "outbound", stages: [
        { id: "rail-out", kind: "rail", origin: { name: "Aalborg" }, destination: { name: "Hamburg" }, durationMinutes: 360, confidence: "medium", costComponentIds: ["rail"] },
        { id: "wait", kind: "transfer", origin: { name: "Hamburg" }, destination: { name: "Hamburg" }, durationMinutes: 40, confidence: "medium", costComponentIds: [], transferType: "connection" },
        { id: "bus-out", kind: "bus", origin: { name: "Hamburg" }, destination: { name: "Trailhead" }, durationMinutes: 180, confidence: "medium", costComponentIds: ["bus"] },
      ] },
      return: { direction: "return", stages: [
        { id: "bus-home", kind: "bus", origin: { name: "Trailhead" }, destination: { name: "Rail station" }, durationMinutes: 90, confidence: "medium", costComponentIds: ["bus"] },
        { id: "rail-home", kind: "rail", origin: { name: "Rail station" }, destination: { name: "Aalborg" }, durationMinutes: 420, confidence: "medium", costComponentIds: ["rail"] },
      ] },
      costComponents: [
        { id: "rail", label: "Return rail", amount: { amount: 1200, currency: "DKK" }, source: "estimate" },
        { id: "bus", label: "Local buses", amount: { amount: 300, currency: "DKK" }, source: "estimate" },
      ],
      warnings: [], assumptions: [], retrievedAt: "2026-07-01T10:00:00Z", source: { provider: "Manual sample" },
    };

    expect(deriveTravelOptionTotals(option)).toMatchObject({ durationMinutes: 1090, cost: { amount: 1500 } });
  });

  it("rejects malformed stage identity, time, coordinates, and provider totals", () => {
    const base: TravelOptionSnapshot = {
      id: "invalid",
      label: "Invalid sample",
      priceType: "sampled",
      pricingBasis: "per-person",
      outbound: { direction: "outbound", stages: [
        { id: "stage", kind: "rail", origin: { name: "A" }, destination: { name: "B" }, durationMinutes: 60, confidence: "medium", costComponentIds: ["fare"] },
      ] },
      return: { direction: "return", stages: [
        { id: "home", kind: "rail", origin: { name: "B" }, destination: { name: "A" }, durationMinutes: 60, confidence: "medium", costComponentIds: ["fare"] },
      ] },
      costComponents: [{ id: "fare", label: "Fare", amount: { amount: 500, currency: "DKK" }, source: "test" }],
      warnings: [], assumptions: [], retrievedAt: "2026-07-01T10:00:00Z", source: { provider: "test" },
    };

    expect(() => deriveTravelOptionTotals({ ...base, return: { direction: "return", stages: [{ ...base.return.stages[0], id: "stage" }] } })).toThrow(/stage id/);
    expect(() => deriveTravelOptionTotals({ ...base, outbound: { direction: "outbound", stages: [{ ...base.outbound.stages[0], departureTime: "invalid", arrivalTime: "2026-07-01T10:00:00Z" }] } })).toThrow(/times/);
    expect(() => deriveTravelOptionTotals({ ...base, outbound: { direction: "outbound", stages: [{ ...base.outbound.stages[0], departureTime: "2026-07-01T11:00:00Z", arrivalTime: "2026-07-01T10:00:00Z" }] } })).toThrow(/times/);
    expect(() => deriveTravelOptionTotals({ ...base, outbound: { direction: "outbound", stages: [{ ...base.outbound.stages[0], origin: { name: "A", coordinates: [181, 57] } }] } })).toThrow(/coordinates/);
    expect(() => deriveTravelOptionTotals({ ...base, outbound: { direction: "outbound", stages: [{ ...base.outbound.stages[0], geometry: [[9, 57]] }] } })).toThrow(/geometry/);
    expect(() => deriveTravelOptionTotals({ ...base, providerTotals: { cost: { amount: 500, currency: "EUR" } } })).toThrow(/one currency/);
    expect(() => deriveTravelOptionTotals({ ...base, source: { provider: "test", url: "javascript:alert(1)" } })).toThrow(/HTTPS/);
    expect(() => deriveTravelOptionTotals({ ...base, outbound: { ...base.outbound, stages: [{ ...base.outbound.stages[0], catalogPartKey: "Test Part" }] } })).toThrow(/catalog part key/);
    expect(() => deriveTravelOptionTotals({ ...base, outbound: { direction: "outbound", stages: [{ ...base.outbound.stages[0], kind: "transfer", transferType: "other" as "wait" }] } })).toThrow(/transfer type/);
    expect(() => deriveTravelOptionTotals({ ...base, costComponents: [{ ...base.costComponents[0], amount: { amount: 500, currency: "USD" as "DKK" } }] })).toThrow(/unsupported/);
    expect(() => deriveTravelOptionTotals({ ...base, warnings: [""] })).toThrow(/warnings/);
    expect(() => deriveTravelOptionTotals({ ...base, retrievedAt: "1" })).toThrow(/retrieval time/);
    expect(() => deriveTravelOptionTotals({ ...base, retrievedAt: "2026-02-31T10:00:00Z" })).toThrow(/retrieval time/);
    expect(() => deriveTravelOptionTotals({ ...base, costComponents: [...base.costComponents, { id: "unused", label: "Unused", amount: { amount: 1, currency: "DKK" }, source: "test" }] })).toThrow(/not referenced/);
    expect(() => deriveTravelOptionTotals({ ...base, costComponents: [], outbound: { ...base.outbound, stages: base.outbound.stages.map((stage) => ({ ...stage, costComponentIds: [] })) }, return: { ...base.return, stages: base.return.stages.map((stage) => ({ ...stage, costComponentIds: [] })) } })).toThrow(/explicit cost component/);
    expect(() => deriveTravelOptionTotals({ ...base, reportedLayovers: { outbound: 1.5, return: 0 } })).toThrow(/layovers/);
  });

  it("uses reported aggregate layovers when individual flight stages are not stored", () => {
    const option: TravelOptionSnapshot = {
      id: "aggregate-flight",
      label: "Aggregate flight",
      priceType: "estimated",
      pricingBasis: "per-person",
      outbound: { direction: "outbound", stages: [{ id: "out", kind: "flight", origin: { name: "A" }, destination: { name: "B" }, durationMinutes: 240, confidence: "low", costComponentIds: ["fare"] }] },
      return: { direction: "return", stages: [{ id: "home", kind: "flight", origin: { name: "B" }, destination: { name: "A" }, durationMinutes: 240, confidence: "low", costComponentIds: ["fare"] }] },
      costComponents: [{ id: "fare", label: "Fare", amount: { amount: 500, currency: "DKK" }, source: "estimate" }],
      reportedLayovers: { outbound: 1, return: 1 },
      warnings: [], assumptions: [], retrievedAt: "2026-07-01T10:00:00Z", source: { provider: "test" },
    };

    expect(deriveTravelOptionTotals(option)).toMatchObject({ layovers: 1, returnLayovers: 1 });
  });

  it("retains differing provider totals for UI reconciliation", () => {
    const option: TravelOptionSnapshot = {
      id: "reconciliation",
      label: "Reconciliation sample",
      priceType: "sampled",
      pricingBasis: "per-person",
      outbound: { direction: "outbound", stages: [{ id: "out", kind: "rail", origin: { name: "A" }, destination: { name: "B" }, durationMinutes: 60, confidence: "medium", costComponentIds: ["fare"] }] },
      return: { direction: "return", stages: [{ id: "home", kind: "rail", origin: { name: "B" }, destination: { name: "A" }, durationMinutes: 60, confidence: "medium", costComponentIds: ["fare"] }] },
      costComponents: [{ id: "fare", label: "Fare", amount: { amount: 500, currency: "DKK" }, source: "test" }],
      providerTotals: { durationMinutes: 125, cost: { amount: 505, currency: "DKK" } },
      warnings: [], assumptions: [], retrievedAt: "2026-07-01T10:00:00Z", source: { provider: "test" },
    };
    expect(deriveTravelOptionTotals(option)).toMatchObject({ durationMinutes: 120, cost: { amount: 500 } });
  });
});
