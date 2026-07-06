import type { DestinationId } from "./destination";

export type HikeId = string;

export type RouteType =
  | "loop"
  | "out-and-back"
  | "point-to-point"
  | "hut-to-hut"
  | "tent-route";

export type Hike = {
  id: HikeId;
  destinationId: DestinationId;
  name: string;
  routeType: RouteType;
  distanceKm?: number;
  elevationGainMeters?: number;
  expectedDurationDays: number;
};
