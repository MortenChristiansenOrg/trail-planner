import {
  calculateCarCost,
  defaultVehicleProfile,
  vehicleProfileKey,
  type UserPreferences,
} from "@trail-planner/domain";
import type {
  Destination,
  TravelEstimate,
} from "@/features/catalog/catalog";
import {
  getEstimatedTravelOptionId,
  getRoadDrivingOptionId,
} from "@/features/catalog/travelOptions";

const aalborgCoordinates: [number, number] = [9.9217, 57.0488];
const assumedAverageDrivingSpeedKph = 72;

export function personalizeDestinations(
  catalog: Destination[],
  preferences: UserPreferences,
): Destination[] {
  return catalog.map((destination) => ({
    ...destination,
    travel: destination.travel.map((estimate) =>
      personalizeEstimate(destination, estimate, preferences),
    ),
  }));
}

export function travelEstimateTotal(
  estimate: TravelEstimate,
  participants: number,
) {
  return estimate.costPerPersonDkk *
    (estimate.pricingBasis === "per-group" ? 1 : participants);
}

function personalizeEstimate(
  destination: Destination,
  estimate: TravelEstimate,
  preferences: UserPreferences,
): TravelEstimate {
  const origin = preferences.homeCity;
  const profileKey = vehicleProfileKey(preferences.vehicle);
  if (estimate.mode !== "car") {
    return {
      ...estimate,
      destinationId: destination.id,
      origin,
      optionId: estimate.available
        ? getEstimatedTravelOptionId(
            destination.id,
            estimate.mode,
            origin.key,
            profileKey,
          )
        : undefined,
      note: estimate.available
        ? `${estimate.note} The catalog public-transport estimate is rebased to ${origin.name}; verify the actual departure station or airport.`
        : estimate.note,
    };
  }
  if (!estimate.available) {
    return {
      ...estimate,
      destinationId: destination.id,
      origin,
      optionId: undefined,
    };
  }

  const baselineOneWayDistanceKm = Math.max(
    100,
    estimate.oneWayHours * assumedAverageDrivingSpeedKph,
  );
  const baselineDistanceKm = baselineOneWayDistanceKm * 2;
  const ratio = originDistanceRatio(
    origin.coordinates,
    destination.coordinates,
  );
  const distanceKm = baselineDistanceKm * ratio;
  const defaultEnergyDkk = calculateCarCost(
    baselineDistanceKm,
    defaultVehicleProfile,
  ).totalDkk;
  const catalogFixedDkk = Math.max(
    0,
    estimate.costPerPersonDkk - defaultEnergyDkk,
  );
  const vehicle = {
    ...preferences.vehicle,
    tollsDkk:
      preferences.vehicle.tollsDkk +
      (destination.countryCode === "NO" ? 0 : catalogFixedDkk),
    ferriesDkk:
      preferences.vehicle.ferriesDkk +
      (destination.countryCode === "NO" ? catalogFixedDkk : 0),
  };
  const costBreakdown = calculateCarCost(distanceKm, vehicle);

  return {
    ...estimate,
    destinationId: destination.id,
    oneWayHours:
      (baselineOneWayDistanceKm * ratio) / assumedAverageDrivingSpeedKph,
    costPerPersonDkk: costBreakdown.totalDkk,
    pricingBasis: "per-group",
    origin,
    vehicle: preferences.vehicle,
    distanceKm: costBreakdown.distanceKm,
    costBreakdown,
    optionId: getRoadDrivingOptionId(
      destination.id,
      origin.key,
      profileKey,
    ),
    note: `${estimate.note} Estimated return drive from ${origin.name}, itemized from ${costBreakdown.distanceKm.toLocaleString("en-DK")} km and your vehicle settings.`,
  };
}

function originDistanceRatio(
  origin: [number, number],
  destination: [number, number],
) {
  const baseline = haversineKm(aalborgCoordinates, destination);
  if (!baseline) return 1;
  return Math.min(1.75, Math.max(0.45, haversineKm(origin, destination) / baseline));
}

function haversineKm(
  [longitudeA, latitudeA]: [number, number],
  [longitudeB, latitudeB]: [number, number],
) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(latitudeB - latitudeA);
  const longitudeDelta = radians(longitudeB - longitudeA);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(latitudeA)) *
      Math.cos(radians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
