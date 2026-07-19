import {
  calculateCostTree,
  calculateScopedCost,
  effectiveCost,
  updateCostOverride,
  type CostCategory,
  type CostItem,
  type TravelOptionSnapshot,
} from "@trail-planner/domain";
import type { TravelEstimate, TravelMode } from "@/features/catalog/catalog";
import type { ExploreSearch } from "@/features/explore/search";

export type PlannedActivity = {
  id: string;
  groupId: string;
  kind: "catalog-hike" | "custom-hike";
  hikeId?: string;
  name: string;
  description: string;
  letter: string;
  segment: number;
  durationDays: number;
};

export type TripDay = {
  day: number;
  calendarDate?: string;
  activities: PlannedActivity[];
};

export type LodgingNight = {
  afterDay: number;
  kind: "none" | "tent-free" | "tent-camping" | "known" | "other";
  name: string;
  costDkk: number;
  knownLodgingId?: string;
};

export type LodgingApplyScope = "single" | "remaining-unplanned" | "all";

export type CustomCost = {
  id: string;
  label: string;
  amountDkk: number;
};

export type TripCostItem = CostItem & {
  travelMode?: TravelMode;
  lodgingAfterDay?: number;
  customCostId?: string;
};

export type PlannedTrip = {
  id: string;
  destinationId: string;
  title: string;
  plannedMonth: number;
  participants: number;
  tripDays: number;
  maxBudgetDkk: number;
  exploreSnapshot: ExploreSearch;
  travelSnapshot: TravelEstimate[];
  selectedTravelMode?: TravelMode;
  selectedTravelOption?: TravelOptionSnapshot;
  startDate?: string;
  days: TripDay[];
  nights: LodgingNight[];
  customCosts: CustomCost[];
  costItems: TripCostItem[];
  shareToken?: string;
  createdAt: number;
  updatedAt: number;
};

export type NewTripInput = {
  destinationId: string;
  destinationName: string;
  search: ExploreSearch;
  travel: TravelEstimate[];
};

const id = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function requireNonNegativeFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }
  return value;
}

const categoryIds: Record<CostCategory, string> = {
  travel: "cost-category-travel",
  lodging: "cost-category-lodging",
  fees: "cost-category-fees",
  custom: "cost-category-custom",
};

const travelLabels: Record<TravelMode, string> = {
  car: "Own car return estimate",
  train: "Rail and bus return tickets",
  plane: "Return flights and ground transfer",
};

function categoryItem(category: CostCategory, label: string): TripCostItem {
  return {
    id: categoryIds[category],
    label,
    category,
    unitCost: { amount: 0, currency: "DKK" },
    chargingScope: "per-group",
    quantity: 1,
    calculatedCost: { amount: 0, currency: "DKK" },
    source: "Trip cost snapshot",
    confidence: "high",
    priceType: "estimated",
  };
}

function baseCostItems(travel: TravelEstimate[], participants: number): TripCostItem[] {
  return [
    categoryItem("travel", "Return travel"),
    categoryItem("lodging", "Lodging"),
    categoryItem("fees", "Fees"),
    categoryItem("custom", "Other costs"),
    ...travel.filter((estimate) => estimate.available).map((estimate): TripCostItem => {
      const unitCost = { amount: estimate.costPerPersonDkk, currency: "DKK" as const };
      return {
        id: `cost-travel-${estimate.mode}`,
        label: travelLabels[estimate.mode],
        category: "travel",
        parentItemId: categoryIds.travel,
        unitCost,
        chargingScope: "per-person",
        quantity: 1,
        calculatedCost: calculateScopedCost(unitCost, "per-person", 1, participants),
        source: estimate.note,
        confidence: estimate.confidence,
        priceType: estimate.mode === "plane" ? "sampled" : "estimated",
        travelMode: estimate.mode,
      };
    }),
  ];
}

export function createTrip(input: NewTripInput): PlannedTrip {
  const now = Date.now();
  return {
    id: id("trip"),
    destinationId: input.destinationId,
    title: `${input.destinationName} in ${new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2026, input.search.month - 1, 1))}`,
    plannedMonth: input.search.month,
    participants: input.search.participants,
    tripDays: input.search.days,
    maxBudgetDkk: input.search.budget,
    exploreSnapshot: input.search,
    travelSnapshot: input.travel,
    days: Array.from({ length: input.search.days }, (_, index) => ({
      day: index + 1,
      activities: [],
    })),
    nights: Array.from({ length: input.search.days - 1 }, (_, index) => ({
      afterDay: index + 1,
      kind: "none",
      name: "Not chosen",
      costDkk: 0,
    })),
    customCosts: [],
    costItems: baseCostItems(input.travel, input.search.participants),
    createdAt: now,
    updatedAt: now,
  };
}

export function getSelectedTravel(trip: PlannedTrip) {
  return trip.travelSnapshot.find((item) => item.mode === trip.selectedTravelMode);
}

export function getTripCostItems(trip: PlannedTrip): TripCostItem[] {
  if (trip.costItems?.length) return trip.costItems;
  const items = baseCostItems(trip.travelSnapshot, trip.participants);
  for (const night of trip.nights) {
    if (night.kind === "none") continue;
    items.push(lodgingCostItem(night));
  }
  for (const custom of trip.customCosts) items.push(customCostItem(custom));
  return items;
}

function lodgingCostItem(night: LodgingNight): TripCostItem {
  const unitCost = { amount: requireNonNegativeFinite(night.costDkk, "Lodging cost"), currency: "DKK" as const };
  return {
    id: `cost-lodging-${night.afterDay}`,
    label: `Night ${night.afterDay}: ${night.name}`,
    category: "lodging",
    parentItemId: categoryIds.lodging,
    unitCost,
    chargingScope: "per-group",
    quantity: 1,
    calculatedCost: calculateScopedCost(unitCost, "per-group", 1, 1),
    source: night.kind === "known" ? "Saved catalog lodging" : "User-planned lodging",
    confidence: night.kind === "known" ? "medium" : "high",
    priceType: night.kind === "known" ? "estimated" : "manual",
    lodgingAfterDay: night.afterDay,
  };
}

function customCostItem(custom: CustomCost): TripCostItem {
  const unitCost = { amount: requireNonNegativeFinite(custom.amountDkk, "Custom cost"), currency: "DKK" as const };
  return {
    id: `cost-custom-${custom.id}`,
    label: custom.label,
    category: "custom",
    parentItemId: categoryIds.custom,
    unitCost,
    chargingScope: "per-group",
    quantity: 1,
    calculatedCost: calculateScopedCost(unitCost, "per-group", 1, 1),
    source: "Added by traveller",
    confidence: "high",
    priceType: "manual",
    customCostId: custom.id,
  };
}

export function calculateTripCost(trip: PlannedTrip) {
  if (!Number.isInteger(trip.participants) || trip.participants < 1) {
    throw new Error("Trip participants must be a positive integer");
  }
  const items = getTripCostItems(trip);
  const include = (item: TripCostItem) => !item.travelMode || item.travelMode === trip.selectedTravelMode;
  const tree = calculateCostTree(items, include);
  const descendantsFor = (parentItemId: string, depth = 1): Array<TripCostItem & { depth: number }> => items
    .filter((candidate) => candidate.parentItemId === parentItemId && include(candidate))
    .flatMap((candidate) => [
      { ...candidate, depth },
      ...descendantsFor(candidate.id, depth + 1),
    ]);
  const categories = items
    .filter((item) => !item.parentItemId)
    .map((item) => ({
      item,
      total: tree.rootTotals.get(item.id) ?? 0,
      children: descendantsFor(item.id),
    }))
    .filter((category) => category.children.length || category.item.overrideCost !== undefined);
  const travelCost = tree.rootTotals.get(categoryIds.travel) ?? 0;
  const lodgingCost = tree.rootTotals.get(categoryIds.lodging) ?? 0;
  const customCost = (tree.rootTotals.get(categoryIds.custom) ?? 0) + (tree.rootTotals.get(categoryIds.fees) ?? 0);
  return {
    items,
    categories,
    travelCost,
    lodgingCost,
    customCost,
    total: tree.total,
    perPerson: Math.round(((tree.total / trip.participants) + Number.EPSILON) * 100) / 100,
  };
}

export function setLodgingNight(trip: PlannedTrip, night: LodgingNight): PlannedTrip {
  if (!trip.nights.some((item) => item.afterDay === night.afterDay)) throw new Error("Lodging night must belong to the trip");
  const costItemId = `cost-lodging-${night.afterDay}`;
  const currentItems = getTripCostItems(trip);
  const previousItem = currentItems.find((item) => item.id === costItemId);
  const costItems = currentItems.filter((item) => item.id !== costItemId);
  if (night.kind !== "none") {
    costItems.push({
      ...lodgingCostItem(night),
      overrideCost: previousItem?.overrideCost,
      overrideNote: previousItem?.overrideNote,
    });
  }
  return {
    ...trip,
    nights: trip.nights.map((item) => item.afterDay === night.afterDay ? night : item),
    costItems,
  };
}

export function applyLodgingChoice(
  trip: PlannedTrip,
  choice: LodgingNight,
  scope: LodgingApplyScope = "single",
): PlannedTrip {
  if (!trip.nights.some((night) => night.afterDay === choice.afterDay)) {
    throw new Error("Lodging night must belong to the trip");
  }
  requireNonNegativeFinite(choice.costDkk, "Lodging cost");

  const targetNights = trip.nights.filter((night) => (
    night.afterDay === choice.afterDay ||
    scope === "all" ||
    (scope === "remaining-unplanned" && night.afterDay > choice.afterDay && night.kind === "none")
  ));

  return targetNights.reduce(
    (nextTrip, night) => setLodgingNight(nextTrip, { ...choice, afterDay: night.afterDay }),
    trip,
  );
}

export function setTripCostOverride(
  trip: PlannedTrip,
  itemId: string,
  amount?: number,
  note?: string,
): PlannedTrip {
  return {
    ...trip,
    costItems: updateCostOverride(getTripCostItems(trip), itemId, amount, note) as TripCostItem[],
  };
}

export function getCostItemAmount(item: TripCostItem) {
  return effectiveCost(item).amount;
}

export function applyStartDate(trip: PlannedTrip, startDate?: string): PlannedTrip {
  if (!startDate) {
    return {
      ...trip,
      startDate: undefined,
      days: trip.days.map((day) => ({ ...day, calendarDate: undefined })),
    };
  }

  const [year, month, day] = startDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  if (!Number.isFinite(start.valueOf()) || start.toISOString().slice(0, 10) !== startDate) {
    throw new Error("Invalid start date");
  }
  return {
    ...trip,
    startDate,
    days: trip.days.map((day, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      return { ...day, calendarDate: date.toISOString().slice(0, 10) };
    }),
  };
}

export function nextTrailLetter(trip: PlannedTrip) {
  const usedLetters = new Set(trip.days.flatMap((day) => day.activities.map((item) => item.letter)));
  for (let index = 0; ; index += 1) {
    let value = index + 1;
    let candidate = "";
    while (value > 0) {
      value -= 1;
      candidate = String.fromCharCode(65 + (value % 26)) + candidate;
      value = Math.floor(value / 26);
    }
    if (!usedLetters.has(candidate)) return candidate;
  }
}

export function addActivity(
  trip: PlannedTrip,
  startDay: number,
  activity: Omit<PlannedActivity, "id" | "groupId" | "segment" | "letter">,
): PlannedTrip {
  if (!Number.isInteger(startDay) || startDay < 1 || startDay > trip.tripDays) {
    throw new Error("startDay must be an integer within the trip");
  }
  if (!Number.isInteger(activity.durationDays) || activity.durationDays < 1) {
    throw new Error("durationDays must be a positive integer");
  }
  const duration = Math.max(1, Math.min(activity.durationDays, trip.tripDays - startDay + 1));
  const groupId = id("activity");
  const letter = nextTrailLetter(trip);
  return {
    ...trip,
    days: trip.days.map((day) => {
      if (day.day < startDay || day.day >= startDay + duration) return day;
      return {
        ...day,
        activities: [
          ...day.activities,
          {
            ...activity,
            durationDays: duration,
            id: id("segment"),
            groupId,
            letter,
            segment: day.day - startDay + 1,
          },
        ],
      };
    }),
  };
}

export function removeActivityGroup(trip: PlannedTrip, groupId: string): PlannedTrip {
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      activities: day.activities.filter((activity) => activity.groupId !== groupId),
    })),
  };
}

export function addCustomCost(trip: PlannedTrip, label: string, amountDkk: number): PlannedTrip {
  const custom = { id: id("cost"), label, amountDkk: requireNonNegativeFinite(amountDkk, "Custom cost") };
  return {
    ...trip,
    customCosts: [...trip.customCosts, custom],
    costItems: [...getTripCostItems(trip), customCostItem(custom)],
  };
}

export function removeCustomCost(trip: PlannedTrip, customCostId: string): PlannedTrip {
  return {
    ...trip,
    customCosts: trip.customCosts.filter((cost) => cost.id !== customCostId),
    costItems: getTripCostItems(trip).filter((item) => item.customCostId !== customCostId),
  };
}

export function createShareToken() {
  return globalThis.crypto.randomUUID().replaceAll("-", "");
}
