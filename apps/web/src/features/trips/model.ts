import type { TravelOptionSnapshot } from "@trail-planner/domain";
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
    createdAt: now,
    updatedAt: now,
  };
}

export function getSelectedTravel(trip: PlannedTrip) {
  return trip.travelSnapshot.find((item) => item.mode === trip.selectedTravelMode);
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

  const copyChoice = (afterDay: number): LodgingNight => ({
    ...choice,
    afterDay,
  });

  return {
    ...trip,
    nights: trip.nights.map((night) => {
      if (night.afterDay === choice.afterDay) return copyChoice(night.afterDay);
      if (scope === "all") return copyChoice(night.afterDay);
      if (
        scope === "remaining-unplanned" &&
        night.afterDay > choice.afterDay &&
        night.kind === "none"
      ) {
        return copyChoice(night.afterDay);
      }
      return night;
    }),
  };
}

export function calculateTripCost(trip: PlannedTrip) {
  const travel = getSelectedTravel(trip);
  const travelCost = travel?.available
    ? requireNonNegativeFinite(travel.costPerPersonDkk, "Travel cost") * trip.participants
    : 0;
  const lodgingCost = trip.nights.reduce(
    (sum, item) => sum + requireNonNegativeFinite(item.costDkk, "Lodging cost"),
    0,
  );
  const customCost = trip.customCosts.reduce(
    (sum, item) => sum + requireNonNegativeFinite(item.amountDkk, "Custom cost"),
    0,
  );
  return {
    travelCost,
    lodgingCost,
    customCost,
    total: travelCost + lodgingCost + customCost,
  };
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
  return {
    ...trip,
    customCosts: [
      ...trip.customCosts,
      { id: id("cost"), label, amountDkk: requireNonNegativeFinite(amountDkk, "Custom cost") },
    ],
  };
}

export function createShareToken() {
  return globalThis.crypto.randomUUID().replaceAll("-", "");
}
