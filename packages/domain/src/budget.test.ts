import { describe, expect, it } from "vitest";
import {
  calculateCostTree,
  calculateScopedCost,
  updateCostOverride,
  type CostItem,
} from "./budget";

const item = ({ id, label, ...overrides }: Partial<CostItem> & Pick<CostItem, "id" | "label">): CostItem => ({
  id,
  label,
  category: "travel",
  unitCost: { amount: 0, currency: "DKK" },
  chargingScope: "per-group",
  quantity: 1,
  calculatedCost: { amount: 0, currency: "DKK" },
  source: "test",
  confidence: "high",
  priceType: "estimated",
  ...overrides,
});

describe("itemized cost model", () => {
  it("calculates person, vehicle, and group scopes with quantities and rounding", () => {
    expect(calculateScopedCost({ amount: 10.125, currency: "DKK" }, "per-person", 2, 3).amount).toBe(60.75);
    expect(calculateScopedCost({ amount: 700, currency: "DKK" }, "per-vehicle", 2, 4).amount).toBe(1_400);
    expect(calculateScopedCost({ amount: 250, currency: "DKK" }, "per-group", 3, 8).amount).toBe(750);
  });

  it("lets a ferry component change without replacing unrelated travel costs", () => {
    const costs = [
      item({ id: "travel", label: "Travel" }),
      item({ id: "passengers", label: "Ferry passengers", parentItemId: "travel", chargingScope: "per-person", unitCost: { amount: 250, currency: "DKK" }, calculatedCost: calculateScopedCost({ amount: 250, currency: "DKK" }, "per-person", 1, 2) }),
      item({ id: "vehicle", label: "Ferry vehicle", parentItemId: "travel", chargingScope: "per-vehicle", unitCost: { amount: 700, currency: "DKK" }, calculatedCost: calculateScopedCost({ amount: 700, currency: "DKK" }, "per-vehicle", 1, 2) }),
      item({ id: "fuel", label: "Fuel", parentItemId: "travel", calculatedCost: { amount: 300, currency: "DKK" } }),
    ];
    const overridden = updateCostOverride(costs, "vehicle", 900, "Larger vehicle fare");

    expect(calculateCostTree(costs).total).toBe(1_500);
    expect(calculateCostTree(overridden).total).toBe(1_700);
    expect(overridden.find((cost) => cost.id === "passengers")?.calculatedCost.amount).toBe(500);
  });

  it("uses a parent override instead of its children and resets to estimates", () => {
    const costs = [
      item({ id: "travel", label: "Travel" }),
      item({ id: "ticket", label: "Tickets", parentItemId: "travel", calculatedCost: { amount: 1_000, currency: "DKK" } }),
      item({ id: "transfer", label: "Transfer", parentItemId: "travel", calculatedCost: { amount: 300, currency: "DKK" } }),
    ];
    const overridden = updateCostOverride(costs, "travel", 1_100, "Confirmed package total");
    const reset = updateCostOverride(overridden, "travel");

    expect(calculateCostTree(overridden).total).toBe(1_100);
    expect(calculateCostTree(reset).total).toBe(1_300);
  });

  it("rejects invalid values and malformed hierarchies", () => {
    expect(() => calculateScopedCost({ amount: -1, currency: "DKK" }, "per-group", 1, 1)).toThrow(/Unit cost/);
    expect(() => calculateScopedCost({ amount: 1, currency: "DKK" }, "per-person", 1, 0)).toThrow(/Participants/);
    expect(() => updateCostOverride([item({ id: "one", label: "One" })], "one", Number.NaN)).toThrow(/Override/);
    expect(() => calculateCostTree([item({ id: "orphan", label: "Orphan", parentItemId: "missing" })])).toThrow(/Missing parent/);
  });

  it("rejects a rootless hierarchy cycle", () => {
    expect(() => calculateCostTree([
      item({ id: "one", label: "One", parentItemId: "two", overrideCost: { amount: 10, currency: "DKK" } }),
      item({ id: "two", label: "Two", parentItemId: "one" }),
    ])).toThrow(/cycle/);
  });

  it("rejects cycles even when every cyclic item is excluded", () => {
    expect(() => calculateCostTree([
      item({ id: "one", label: "One", parentItemId: "two" }),
      item({ id: "two", label: "Two", parentItemId: "one" }),
    ], () => false)).toThrow(/cycle/);
  });

  it("rejects mixed currencies before aggregating totals", () => {
    expect(() => calculateCostTree([
      item({ id: "travel", label: "Travel" }),
      item({
        id: "ticket",
        label: "Ticket",
        parentItemId: "travel",
        unitCost: { amount: 100, currency: "EUR" },
        calculatedCost: { amount: 100, currency: "EUR" },
      }),
    ])).toThrow(/one currency/);
  });
});
