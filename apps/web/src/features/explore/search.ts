import type { Destination, TravelEstimate, TravelMode } from "@/features/catalog/catalog";

export type ExploreSearch = {
  month: number;
  participants: number;
  days: number;
  budget: number;
  modes: TravelMode[];
  maxLayovers: number;
  maxDriveHours: number;
  maxFlightDkk: number;
  countries: string[];
  seasonTolerance: number;
  selected?: string;
  details?: boolean;
};

export const defaultExploreSearch: ExploreSearch = {
  month: 7,
  participants: 2,
  days: 5,
  budget: 12_000,
  modes: ["car", "train", "plane"],
  maxLayovers: 0,
  maxDriveHours: 18,
  maxFlightDkk: 5_000,
  countries: [],
  seasonTolerance: 0,
};

const numberBetween = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

const list = (value: unknown) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value) return value.split(",").filter(Boolean);
  return [];
};

export function parseExploreSearch(raw: Record<string, unknown>): ExploreSearch {
  const requestedModes = list(raw.modes).filter((mode): mode is TravelMode =>
    ["car", "train", "plane"].includes(mode),
  );

  return {
    month: numberBetween(raw.month, defaultExploreSearch.month, 1, 12),
    participants: numberBetween(raw.participants, defaultExploreSearch.participants, 1, 12),
    days: numberBetween(raw.days, defaultExploreSearch.days, 2, 21),
    budget: numberBetween(raw.budget, defaultExploreSearch.budget, 1_000, 100_000),
    modes: requestedModes.length ? requestedModes : defaultExploreSearch.modes,
    maxLayovers: numberBetween(raw.maxLayovers, defaultExploreSearch.maxLayovers, 0, 3),
    maxDriveHours: numberBetween(raw.maxDriveHours, defaultExploreSearch.maxDriveHours, 4, 40),
    maxFlightDkk: numberBetween(raw.maxFlightDkk, defaultExploreSearch.maxFlightDkk, 500, 20_000),
    countries: list(raw.countries),
    seasonTolerance: numberBetween(raw.seasonTolerance, defaultExploreSearch.seasonTolerance, 0, 3),
    selected: typeof raw.selected === "string" ? raw.selected : undefined,
    details: raw.details === true || raw.details === "true",
  };
}

export function toSearchParams(search: ExploreSearch): ExploreSearch {
  return search;
}

export function monthDistance(month: number, recommendedMonths: number[]) {
  let minimum = 12;
  for (const recommended of recommendedMonths) {
    const direct = Math.abs(month - recommended);
    minimum = Math.min(minimum, direct, 12 - direct);
  }
  return minimum;
}

export function estimateFits(estimate: TravelEstimate, search: ExploreSearch) {
  if (!estimate.available || !search.modes.includes(estimate.mode)) return false;
  if (estimate.mode === "car" && estimate.hours > search.maxDriveHours) return false;
  if (
    estimate.mode === "plane" &&
    ((estimate.layovers ?? 0) > search.maxLayovers || estimate.costPerPersonDkk > search.maxFlightDkk)
  ) {
    return false;
  }

  const travelDays = Math.max(2, Math.ceil((estimate.hours * 2) / 12));
  const totalTransport = estimate.costPerPersonDkk * search.participants;
  return travelDays < search.days && totalTransport <= search.budget;
}

export function getViableEstimates(destination: Destination, search: ExploreSearch) {
  return destination.travel.filter((estimate) => estimateFits(estimate, search));
}

export type ExploreResult = {
  destination: Destination;
  viable: TravelEstimate[];
  best: TravelEstimate;
  seasonDistance: number;
  score: number;
};

export function rankDestinations(destinations: Destination[], search: ExploreSearch): ExploreResult[] {
  const results: ExploreResult[] = [];

  for (const destination of destinations) {
    if (search.countries.length && !search.countries.includes(destination.countryCode)) continue;
    const seasonDistance = monthDistance(search.month, destination.recommendedMonths);
    if (seasonDistance > search.seasonTolerance) continue;

    const viable = getViableEstimates(destination, search);
    if (!viable.length) continue;

    const best = viable.reduce((current, candidate) => {
      const currentScore = current.costPerPersonDkk / 100 + current.hours * 2;
      const candidateScore = candidate.costPerPersonDkk / 100 + candidate.hours * 2;
      return candidateScore < currentScore ? candidate : current;
    });
    const score =
      100 -
      seasonDistance * 18 -
      best.hours * 0.9 -
      (best.costPerPersonDkk * search.participants * 25) / search.budget;

    results.push({ destination, viable, best, seasonDistance, score });
  }

  return results.toSorted((a, b) => b.score - a.score);
}

export const modeLabels: Record<TravelMode, string> = {
  car: "Own car",
  train: "Train + bus",
  plane: "Airplane",
};
