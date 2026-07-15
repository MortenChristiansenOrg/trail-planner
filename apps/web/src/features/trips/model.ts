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

export function calculateTripCost(trip: PlannedTrip) {
  const travel = getSelectedTravel(trip);
  const travelCost = travel?.available ? travel.costPerPersonDkk * trip.participants : 0;
  const lodgingCost = trip.nights.reduce((sum, item) => sum + item.costDkk, 0);
  const customCost = trip.customCosts.reduce((sum, item) => sum + item.amountDkk, 0);
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

  const start = new Date(`${startDate}T12:00:00`);
  return {
    ...trip,
    startDate,
    days: trip.days.map((day, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { ...day, calendarDate: date.toISOString().slice(0, 10) };
    }),
  };
}

export function nextTrailLetter(trip: PlannedTrip) {
  const groupIds = new Set(trip.days.flatMap((day) => day.activities.map((item) => item.groupId)));
  return String.fromCharCode(65 + Math.min(groupIds.size, 25));
}

export function addActivity(
  trip: PlannedTrip,
  startDay: number,
  activity: Omit<PlannedActivity, "id" | "groupId" | "segment" | "letter">,
): PlannedTrip {
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
    customCosts: [...trip.customCosts, { id: id("cost"), label, amountDkk }],
  };
}

export function createShareToken() {
  return `${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}
