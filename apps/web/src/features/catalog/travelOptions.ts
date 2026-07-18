import type { TravelOptionSnapshot } from "@trail-planner/domain";
import type { DrivingRoute } from "@/features/maps/drivingRoute";
import { aalborgCoordinates } from "@/features/maps/drivingRoute";

export const innsbruckDrivingOptionId = "osrm-driving-aalborg-innsbruck";
export const innsbruckCoordinates: [number, number] = [11.404, 47.269];

export function createInnsbruckDrivingOption(
  outbound: DrivingRoute,
  inbound: DrivingRoute,
  retrievedAt = new Date().toISOString(),
): TravelOptionSnapshot {
  const costId = "innsbruck-driving-estimate";
  return {
    id: innsbruckDrivingOptionId,
    label: "Drive from Aalborg to Innsbruck",
    priceType: "estimated",
    pricingBasis: "per-person",
    outbound: {
      direction: "outbound",
      stages: [{
        id: "innsbruck-driving-outbound",
        kind: "car",
        origin: { name: "Aalborg", coordinates: aalborgCoordinates },
        destination: { name: "Innsbruck", coordinates: innsbruckCoordinates },
        durationMinutes: outbound.durationMinutes,
        geometry: outbound.coordinates,
        sourceUrl: outbound.sourceUrl,
        confidence: "high",
        costComponentIds: [costId],
      }],
    },
    return: {
      direction: "return",
      stages: [{
        id: "innsbruck-driving-return",
        kind: "car",
        origin: { name: "Innsbruck", coordinates: innsbruckCoordinates },
        destination: { name: "Aalborg", coordinates: aalborgCoordinates },
        durationMinutes: inbound.durationMinutes,
        geometry: inbound.coordinates,
        sourceUrl: inbound.sourceUrl,
        confidence: "high",
        costComponentIds: [costId],
      }],
    },
    costComponents: [{
      id: costId,
      label: "Return driving estimate",
      amount: { amount: 1_950, currency: "DKK" },
      source: "Saved Explore catalog estimate",
    }],
    warnings: ["Road geometry and drive time come from OSRM; traffic, rest stops, ferry waits, and availability are not included."],
    assumptions: ["The route uses the same Aalborg and southern-Denmark waypoints as the Explore map."],
    retrievedAt,
    source: { provider: "OSRM", url: "https://project-osrm.org/" },
  };
}
