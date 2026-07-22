import {
  deriveCatalogJourneyDuration,
  type AvailableCatalogTripMode,
  type CatalogDestinationTripPlan,
  type CatalogTravelPart,
  type CatalogTravelPartFile,
  type CatalogTravelPartReference,
  type CatalogTripPlanFile,
  type JourneyDirection,
} from "@trail-planner/domain";
import travelPartData from "../../../../../data/catalog/travel-parts.json";
import tripPlanData from "../../../../../data/catalog/trip-plans.json";

const travelPartFile = travelPartData as CatalogTravelPartFile;
const tripPlanFile = tripPlanData as CatalogTripPlanFile;
const partByKey = new Map(travelPartFile.parts.map((part) => [part.key, part]));
const planByDestinationKey = new Map(tripPlanFile.plans.map((plan) => [plan.destinationKey, plan]));

const exploreDestinationKeys: Record<string, string> = {
  hardanger: "odda",
  jotunheimen: "gjendesheim",
  lofoten: "svolvaer",
  romsdalen: "andalsnes",
};

export type ResolvedCatalogTravelPart = {
  part: CatalogTravelPart;
  origin: CatalogTravelPart["origin"];
  destination: CatalogTravelPart["destination"];
  reverse: boolean;
};

export function getExploreCatalogTripPlan(destinationId: string): CatalogDestinationTripPlan | undefined {
  const destinationKey = exploreDestinationKeys[destinationId];
  return destinationKey ? planByDestinationKey.get(destinationKey) : undefined;
}

export function getCatalogCarPlan(destinationId: string): AvailableCatalogTripMode | undefined {
  const plan = getExploreCatalogTripPlan(destinationId)?.modes.car;
  return plan?.status === "available" ? plan : undefined;
}

export function getCatalogCarOptionId(destinationId: string) {
  const destinationKey = exploreDestinationKeys[destinationId];
  return destinationKey ? `catalog-car-aalborg-${destinationKey}` : undefined;
}

export function getExploreDestinationIdForOption(optionId: string) {
  const destinationKey = optionId.startsWith("catalog-car-aalborg-")
    ? optionId.slice("catalog-car-aalborg-".length)
    : undefined;
  return destinationKey
    ? Object.entries(exploreDestinationKeys).find(([, key]) => key === destinationKey)?.[0]
    : undefined;
}

export function getCatalogCarDurationMinutes(destinationId: string) {
  const plan = getCatalogCarPlan(destinationId);
  return plan ? deriveCatalogJourneyDuration(plan.outbound, travelPartFile.parts).maximumMinutes : undefined;
}

export function getCatalogUnavailableReason(destinationId: string, mode: "train-bus" | "airplane") {
  const plan = getExploreCatalogTripPlan(destinationId)?.modes[mode];
  return plan?.status === "details-unavailable" ? plan.reason : undefined;
}

export function resolveCatalogCarJourney(destinationId: string, direction: JourneyDirection): ResolvedCatalogTravelPart[] {
  const plan = getCatalogCarPlan(destinationId);
  if (!plan) return [];
  const references = direction === "outbound" ? plan.outbound : plan.return;
  return references.map(resolveReference);
}

export function getCatalogFerryPart(destinationId: string) {
  return resolveCatalogCarJourney(destinationId, "outbound").find(({ part }) => part.kind === "ferry")?.part;
}

function resolveReference(reference: CatalogTravelPartReference): ResolvedCatalogTravelPart {
  const part = partByKey.get(reference.partKey);
  if (!part) throw new Error(`Unknown catalog travel part: ${reference.partKey}`);
  const reverse = reference.reverse === true;
  return {
    part,
    origin: reverse ? part.destination : part.origin,
    destination: reverse ? part.origin : part.destination,
    reverse,
  };
}
