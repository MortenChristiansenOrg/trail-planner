import type { Money } from "./budget";
import type { DestinationId } from "./destination";
import type { TravelMode } from "./travel";

export type Month =
  | "january"
  | "february"
  | "march"
  | "april"
  | "may"
  | "june"
  | "july"
  | "august"
  | "september"
  | "october"
  | "november"
  | "december";

export type ExploreSearch = {
  month: Month;
  participants: number;
  maxDays: number;
  maxBudget: Money;
  travelModes: TravelMode[];
  countryCodes: string[];
};

export type DestinationListItem = {
  destinationId: DestinationId;
  name: string;
  countryCode: string;
  region: string;
  seasonFit: "inside" | "near" | "outside";
};
