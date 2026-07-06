import type { Money } from "./budget";
import type { DestinationId } from "./destination";
import type { ProvenanceClaim } from "./provenance";
import type { Month } from "./readModels";

export type TravelMode = "car" | "train-bus" | "airplane";

export type TravelEstimate = {
  destinationId: DestinationId;
  mode: TravelMode;
  month: Month;
  available: boolean;
  durationHours?: number;
  costPerPerson?: Money;
  provenance: ProvenanceClaim[];
};
