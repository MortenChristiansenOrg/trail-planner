export type CurrencyCode = "DKK" | "EUR" | "NOK" | "SEK" | "GBP";

export type Money = {
  amount: number;
  currency: CurrencyCode;
};

export type CostScope = "per-person" | "per-vehicle" | "per-group";
export type CostCategory = "travel" | "lodging" | "fees" | "custom";
export type CostConfidence = "low" | "medium" | "high";
export type CostPriceType = "live" | "sampled" | "estimated" | "manual";

export type CostItem = {
  id: string;
  label: string;
  category: CostCategory;
  parentItemId?: string;
  unitCost: Money;
  chargingScope: CostScope;
  quantity: number;
  calculatedCost: Money;
  overrideCost?: Money;
  overrideNote?: string;
  source: string;
  confidence: CostConfidence;
  priceType: CostPriceType;
};

export type BudgetItem = CostItem;

function requireAmount(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }
  return value;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateScopedCost(
  unitCost: Money,
  chargingScope: CostScope,
  quantity: number,
  participants: number,
): Money {
  requireAmount(unitCost.amount, "Unit cost");
  requireAmount(quantity, "Quantity");
  if (!Number.isInteger(participants) || participants < 1) {
    throw new Error("Participants must be a positive integer");
  }
  const multiplier = chargingScope === "per-person" ? participants : 1;
  return {
    amount: roundCurrency(unitCost.amount * quantity * multiplier),
    currency: unitCost.currency,
  };
}

export function effectiveCost(item: CostItem): Money {
  const cost = item.overrideCost ?? item.calculatedCost;
  requireAmount(cost.amount, "Effective cost");
  return cost;
}

export function updateCostOverride(
  items: CostItem[],
  itemId: string,
  amount?: number,
  note?: string,
): CostItem[] {
  if (!items.some((item) => item.id === itemId)) throw new Error("Cost item not found");
  if (amount !== undefined) requireAmount(amount, "Override cost");
  return items.map((item) => item.id === itemId
    ? {
        ...item,
        overrideCost: amount === undefined ? undefined : { amount: roundCurrency(amount), currency: item.calculatedCost.currency },
        overrideNote: amount === undefined ? undefined : note?.trim() || undefined,
      }
    : item);
}

export function calculateCostTree(
  items: CostItem[],
  include: (item: CostItem) => boolean = () => true,
) {
  const byId = new Map<string, CostItem>();
  const children = new Map<string, CostItem[]>();
  for (const item of items) {
    if (byId.has(item.id)) throw new Error(`Duplicate cost item id: ${item.id}`);
    requireAmount(item.unitCost.amount, "Unit cost");
    requireAmount(item.quantity, "Quantity");
    requireAmount(item.calculatedCost.amount, "Calculated cost");
    if (item.overrideCost) requireAmount(item.overrideCost.amount, "Override cost");
    if (item.unitCost.currency !== item.calculatedCost.currency) {
      throw new Error(`Cost item currencies must match: ${item.id}`);
    }
    if (item.overrideCost && item.overrideCost.currency !== item.calculatedCost.currency) {
      throw new Error(`Cost item currencies must match: ${item.id}`);
    }
    byId.set(item.id, item);
    if (item.parentItemId) children.set(item.parentItemId, [...(children.get(item.parentItemId) ?? []), item]);
  }
  for (const item of items) {
    if (item.parentItemId && !byId.has(item.parentItemId)) {
      throw new Error(`Missing parent cost item: ${item.parentItemId}`);
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const validateHierarchy = (item: CostItem) => {
    if (visited.has(item.id)) return;
    if (visiting.has(item.id)) throw new Error("Cost item hierarchy contains a cycle");
    visiting.add(item.id);
    for (const child of children.get(item.id) ?? []) validateHierarchy(child);
    visiting.delete(item.id);
    visited.add(item.id);
  };
  for (const item of items) validateHierarchy(item);

  const includedCurrencies = new Set(
    items.filter(include).map((item) => item.calculatedCost.currency),
  );
  if (includedCurrencies.size > 1) {
    throw new Error("Included cost items must use one currency");
  }

  const totalFor = (item: CostItem): number => {
    if (!include(item)) return 0;
    if (item.overrideCost) return effectiveCost(item).amount;
    const nested = children.get(item.id) ?? [];
    if (!nested.length) return effectiveCost(item).amount;
    const total = nested.reduce((sum, child) => sum + totalFor(child), 0);
    return roundCurrency(total);
  };

  const roots = items.filter((item) => !item.parentItemId);
  const rootTotals = new Map(roots.map((item) => [item.id, totalFor(item)]));
  return {
    rootTotals,
    total: roundCurrency(Array.from(rootTotals.values()).reduce((sum, amount) => sum + amount, 0)),
  };
}
