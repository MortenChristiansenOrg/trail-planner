import type { TravelOptionSnapshot } from "@trail-planner/domain";
import type { DrivingRoute } from "@/features/maps/drivingRoute";
import { aalborgCoordinates } from "@/features/maps/drivingRoute";

export const getRoadDrivingOptionId = (destinationId: string) => `osrm-driving-aalborg-${destinationId}`;
export const innsbruckDrivingOptionId = getRoadDrivingOptionId("innsbruck");
export const innsbruckCoordinates: [number, number] = [11.404, 47.269];

export type DrivingOptionInput = {
  destinationId: string;
  destinationName: string;
  destinationCoordinates: [number, number];
  oneWayHours: number;
  costPerPersonDkk: number;
  viaSouthernDenmark: boolean;
};

export function createDrivingOption(
  input: DrivingOptionInput,
  outbound?: DrivingRoute,
  inbound?: DrivingRoute,
  retrievedAt = new Date().toISOString(),
): TravelOptionSnapshot {
  const optionId = getRoadDrivingOptionId(input.destinationId);
  const costId = `${input.destinationId}-driving-estimate`;
  const fallbackDurationMinutes = Math.round(input.oneWayHours * 60);
  const availableRouteCount = Number(Boolean(outbound)) + Number(Boolean(inbound));
  return {
    id: optionId,
    label: `Drive from Aalborg to ${input.destinationName}`,
    priceType: "estimated",
    pricingBasis: "per-person",
    outbound: {
      direction: "outbound",
      stages: [{
        id: `${input.destinationId}-driving-outbound`,
        kind: "car",
        origin: { name: "Aalborg", coordinates: aalborgCoordinates },
        destination: { name: input.destinationName, coordinates: input.destinationCoordinates },
        durationMinutes: outbound?.durationMinutes ?? fallbackDurationMinutes,
        geometry: outbound?.coordinates,
        sourceUrl: outbound?.sourceUrl,
        confidence: outbound ? "high" : "medium",
        costComponentIds: [costId],
      }],
    },
    return: {
      direction: "return",
      stages: [{
        id: `${input.destinationId}-driving-return`,
        kind: "car",
        origin: { name: input.destinationName, coordinates: input.destinationCoordinates },
        destination: { name: "Aalborg", coordinates: aalborgCoordinates },
        durationMinutes: inbound?.durationMinutes ?? fallbackDurationMinutes,
        geometry: inbound?.coordinates,
        sourceUrl: inbound?.sourceUrl,
        confidence: inbound ? "high" : "medium",
        costComponentIds: [costId],
      }],
    },
    costComponents: [{
      id: costId,
      label: "Return driving estimate",
      amount: { amount: input.costPerPersonDkk, currency: "DKK" },
      source: "Saved Explore catalog estimate",
    }],
    warnings: availableRouteCount === 2
      ? ["Road geometry and drive time come from OSRM; traffic, rest stops, ferry waits, and availability are not included."]
      : availableRouteCount === 1
        ? ["Live road geometry could not be refreshed for one direction, so its saved Explore duration estimate is shown."]
        : ["Live road geometry could not be refreshed, so the saved Explore duration estimate is shown."],
    assumptions: [
      input.viaSouthernDenmark
        ? "The route uses the same Aalborg and southern-Denmark waypoints as the Explore map."
        : "The route uses the same Aalborg and destination access nodes as the Explore map.",
    ],
    retrievedAt,
    source: availableRouteCount === 2
      ? { provider: "OSRM", url: "https://project-osrm.org/" }
      : availableRouteCount === 1
        ? { provider: "OSRM + saved Explore catalog estimate", url: "https://project-osrm.org/" }
        : { provider: "Saved Explore catalog estimate" },
  };
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
