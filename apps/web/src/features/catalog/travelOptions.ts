import type {
  CarCostEstimate,
  HomeCity,
  TravelCostComponent,
  TravelOptionSnapshot,
} from "@trail-planner/domain";
import type { DrivingRoute } from "@/features/maps/drivingRoute";
import { aalborgCoordinates } from "@/features/maps/drivingRoute";

export const getRoadDrivingOptionId = (
  destinationId: string,
  originKey = "aalborg",
  vehicleKey = "legacy",
) => `osrm-driving-${destinationId}--${originKey}--${vehicleKey}`;
export const getEstimatedTravelOptionId = (
  destinationId: string,
  mode: "train" | "plane",
  originKey = "aalborg",
  vehicleKey = "legacy",
) => `catalog-estimate-${destinationId}-${mode}--${originKey}--${vehicleKey}`;
export const innsbruckDrivingOptionId = getRoadDrivingOptionId("innsbruck");
export const innsbruckCoordinates: [number, number] = [11.404, 47.269];

export type DrivingOptionInput = {
  optionId?: string;
  destinationId: string;
  destinationName: string;
  destinationCoordinates: [number, number];
  oneWayHours: number;
  costPerPersonDkk: number;
  viaSouthernDenmark: boolean;
  origin?: HomeCity;
  costBreakdown?: CarCostEstimate;
};

export function createDrivingOption(
  input: DrivingOptionInput,
  outbound?: DrivingRoute,
  inbound?: DrivingRoute,
  retrievedAt = new Date().toISOString(),
): TravelOptionSnapshot {
  const origin = input.origin ?? {
    key: "aalborg",
    name: "Aalborg",
    countryCode: "DK" as const,
    coordinates: aalborgCoordinates,
  };
  const optionId = input.optionId ?? getRoadDrivingOptionId(input.destinationId);
  const costComponents = drivingCostComponents(input);
  const costIds = costComponents.map(({ id }) => id);
  const fallbackDurationMinutes = Math.round(input.oneWayHours * 60);
  const availableRouteCount = Number(Boolean(outbound)) + Number(Boolean(inbound));
  return {
    id: optionId,
    label: `Drive from ${origin.name} to ${input.destinationName}`,
    priceType: "estimated",
    pricingBasis: input.costBreakdown ? "per-group" : "per-person",
    outbound: {
      direction: "outbound",
      stages: [{
        id: `${input.destinationId}-driving-outbound`,
        kind: "car",
        origin: { name: origin.name, coordinates: origin.coordinates },
        destination: { name: input.destinationName, coordinates: input.destinationCoordinates },
        durationMinutes: outbound?.durationMinutes ?? fallbackDurationMinutes,
        geometry: outbound?.coordinates,
        sourceUrl: outbound?.sourceUrl,
        confidence: outbound ? "high" : "medium",
        costComponentIds: costIds,
      }],
    },
    return: {
      direction: "return",
      stages: [{
        id: `${input.destinationId}-driving-return`,
        kind: "car",
        origin: { name: input.destinationName, coordinates: input.destinationCoordinates },
        destination: { name: origin.name, coordinates: origin.coordinates },
        durationMinutes: inbound?.durationMinutes ?? fallbackDurationMinutes,
        geometry: inbound?.coordinates,
        sourceUrl: inbound?.sourceUrl,
        confidence: inbound ? "high" : "medium",
        costComponentIds: costIds,
      }],
    },
    costComponents,
    warnings: availableRouteCount === 2
      ? ["Road geometry and drive time come from OSRM; traffic, rest stops, ferry waits, and availability are not included."]
      : availableRouteCount === 1
        ? ["Live road geometry could not be refreshed for one direction, so its saved Explore duration estimate is shown."]
        : ["Live road geometry could not be refreshed, so the saved Explore duration estimate is shown."],
    assumptions: [
      input.viaSouthernDenmark
        ? `The route uses the same ${origin.name} and southern-Denmark waypoints as the Explore map.`
        : `The route uses the same ${origin.name} and destination access nodes as the Explore map.`,
      ...(input.costBreakdown?.assumptions ?? []),
    ],
    retrievedAt,
    source: availableRouteCount === 2
      ? { provider: "OSRM", url: "https://project-osrm.org/" }
      : availableRouteCount === 1
        ? { provider: "OSRM + saved Explore catalog estimate", url: "https://project-osrm.org/" }
        : { provider: "Saved Explore catalog estimate" },
  };
}

export type EstimatedTravelOptionInput = {
  optionId?: string;
  destinationId: string;
  destinationName: string;
  destinationCoordinates: [number, number];
  mode: "train" | "plane";
  oneWayHours: number;
  costPerPersonDkk: number;
  layovers?: number;
  confidence: "low" | "medium" | "high";
  origin?: HomeCity;
};

export function createEstimatedTravelOption(
  input: EstimatedTravelOptionInput,
  retrievedAt = new Date().toISOString(),
): TravelOptionSnapshot {
  const origin = input.origin ?? {
    key: "aalborg",
    name: "Aalborg",
    countryCode: "DK" as const,
    coordinates: aalborgCoordinates,
  };
  const optionId = input.optionId ?? getEstimatedTravelOptionId(input.destinationId, input.mode);
  const costId = `${input.destinationId}-${input.mode}-estimate`;
  const durationMinutes = Math.round(input.oneWayHours * 60);
  const isTrain = input.mode === "train";
  const routeLabel = isTrain ? "Train + bus" : "Flight + ground transfer";
  const stageKind = isTrain ? "rail" as const : "flight" as const;
  const layovers = isTrain ? undefined : input.layovers ?? 0;
  const stage = (direction: "outbound" | "return") => ({
    id: `${input.destinationId}-${input.mode}-${direction}`,
    kind: stageKind,
    origin: direction === "outbound"
      ? { name: origin.name, coordinates: origin.coordinates }
      : { name: input.destinationName, coordinates: input.destinationCoordinates },
    destination: direction === "outbound"
      ? { name: input.destinationName, coordinates: input.destinationCoordinates }
      : { name: origin.name, coordinates: origin.coordinates },
    durationMinutes,
    service: `${routeLabel} planning route`,
    confidence: input.confidence,
    costComponentIds: [costId],
    technicalStops: layovers
      ? [`Aggregate estimate includes ${layovers} layover${layovers === 1 ? "" : "s"}; connection airports are not specified.`]
      : [],
  });
  return {
    id: optionId,
    label: `${routeLabel} from ${origin.name} to ${input.destinationName}`,
    priceType: "estimated",
    pricingBasis: "per-person",
    outbound: { direction: "outbound", stages: [stage("outbound")] },
    return: { direction: "return", stages: [stage("return")] },
    costComponents: [{
      id: costId,
      label: `Estimated return ${isTrain ? "train and bus" : "air and ground-transfer"} cost`,
      amount: { amount: input.costPerPersonDkk, currency: "DKK" },
      source: "Saved Explore catalog estimate",
    }],
    reportedLayovers: layovers === undefined ? undefined : { outbound: layovers, return: layovers },
    warnings: [
      `This is an aggregate ${routeLabel.toLowerCase()} estimate, not a date-specific timetable or fare.`,
      isTrain
        ? "Intermediate stations, vehicle changes, and wait times are included in the estimate but are not individually specified."
        : "Airports, individual flight segments, ground-transfer legs, and connection times are included in the estimate but are not individually specified.",
    ],
    assumptions: ["The outbound and return journeys use the same published one-way planning duration."],
    retrievedAt,
    source: { provider: "Saved Explore catalog estimate" },
  };
}

export function drivingCostComponents(
  input: Pick<
    DrivingOptionInput,
    "costBreakdown" | "costPerPersonDkk" | "destinationId"
  >,
): TravelCostComponent[] {
  if (!input.costBreakdown) {
    return [{
      id: `${input.destinationId}-driving-estimate`,
      label: "Return driving estimate",
      amount: { amount: input.costPerPersonDkk, currency: "DKK" },
      source: "Saved Explore catalog estimate",
    }];
  }
  return input.costBreakdown.components.map((component) => ({
    id: `${input.destinationId}-driving-${component.kind}`,
    label: component.label,
    amount: { amount: component.amountDkk, currency: "DKK" },
    source: component.estimated
      ? "Vehicle profile estimate"
      : "User vehicle and trip preference",
  }));
}

export function createInnsbruckDrivingOption(
  outbound: DrivingRoute,
  inbound: DrivingRoute,
  retrievedAt = new Date().toISOString(),
): TravelOptionSnapshot {
  return createDrivingOption({
    destinationId: "innsbruck",
    destinationName: "Innsbruck",
    destinationCoordinates: innsbruckCoordinates,
    oneWayHours: 13.5,
    costPerPersonDkk: 1_950,
    viaSouthernDenmark: true,
  }, outbound, inbound, retrievedAt);
}
