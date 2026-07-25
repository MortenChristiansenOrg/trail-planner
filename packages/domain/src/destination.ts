import type { Month } from "./readModels";

export type DestinationId = string;

export type Destination = {
  id: DestinationId;
  name: string;
  countryCode: string;
  region: string;
  recommendedMonths: Month[];
  visibility: "published" | "archived";
};
