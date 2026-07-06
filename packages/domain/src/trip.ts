import type { Money } from "./budget";
import type { DestinationId } from "./destination";
import type { ExploreSearch } from "./readModels";
import type { TravelMode } from "./travel";

export type TripId = string;

export type PlannedTrip = {
  id: TripId;
  ownerId: string;
  destinationId: DestinationId;
  exploreSnapshot: ExploreSearch;
  plannedMonth: ExploreSearch["month"];
  selectedTravelMode?: TravelMode;
  estimatedTotalCost: Money;
};
