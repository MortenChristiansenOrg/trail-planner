import type { ConfidenceLevel } from "./provenance";

export const catalogTravelModes = ["car", "train-bus", "airplane"] as const;
export type CatalogTravelMode = (typeof catalogTravelModes)[number];

export type CatalogTravelPlace = {
  key: string;
  name: string;
  coordinates: [longitude: number, latitude: number];
};

export type CatalogTravelSource = {
  key: string;
  url: string;
  kind: "official" | "provider";
  retrievedAt: string;
  refreshAfter: string;
  endpointSnapMeters?: [origin: number, destination: number];
};

export type CatalogTravelPart = {
  key: string;
  kind: "car" | "ferry";
  origin: CatalogTravelPlace;
  destination: CatalogTravelPlace;
  durationMinutes?: number;
  durationRangeMinutes?: [minimum: number, maximum: number];
  distanceKm?: number;
  recommendedArrivalMinutes?: number;
  operator?: string;
  service?: string;
  availability?: string;
  bookingUrl?: string;
  confidence: ConfidenceLevel;
  source: CatalogTravelSource;
};

export type CatalogTravelPartReference = {
  partKey: string;
  reverse?: boolean;
};

export type AvailableCatalogTripMode = {
  status: "available";
  outbound: CatalogTravelPartReference[];
  return: CatalogTravelPartReference[];
  selectionNote?: string;
};

export type UnavailableCatalogTripMode = {
  status: "details-unavailable";
  reason: string;
};

export type CatalogTripModePlan = AvailableCatalogTripMode | UnavailableCatalogTripMode;

export type CatalogDestinationTripPlan = {
  key: string;
  destinationKey: string;
  originKey: string;
  modes: Record<CatalogTravelMode, CatalogTripModePlan>;
};

export type CatalogTravelPartFile = {
  schemaVersion: 1;
  parts: CatalogTravelPart[];
};

export type CatalogTripPlanFile = {
  schemaVersion: 1;
  plans: CatalogDestinationTripPlan[];
};

const keyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const partKinds = new Set<unknown>(["car", "ferry"]);
const confidenceLevels = new Set<unknown>(["low", "medium", "high"]);
const sourceKinds = new Set<unknown>(["official", "provider"]);

export function isCatalogTravelKey(value: unknown): value is string {
  return typeof value === "string" && keyPattern.test(value);
}

function validUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validIsoDate(value: unknown) {
  if (typeof value !== "string" || !isoDatePattern.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString() === value;
}

function validCoordinates([longitude, latitude]: [number, number]) {
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 &&
    Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

function effectiveEndpoints(part: CatalogTravelPart, reverse = false) {
  return reverse
    ? { origin: part.destination.key, destination: part.origin.key }
    : { origin: part.origin.key, destination: part.destination.key };
}

export function deriveCatalogJourneyDuration(
  references: CatalogTravelPartReference[],
  parts: CatalogTravelPart[],
) {
  const partByKey = new Map(parts.map((part) => [part.key, part]));
  let minimumMinutes = 0;
  let maximumMinutes = 0;
  for (const reference of references) {
    const part = partByKey.get(reference.partKey);
    if (!part) throw new Error(`Unknown catalog travel part: ${reference.partKey}`);
    const minimum = part.durationMinutes ?? part.durationRangeMinutes?.[0];
    const maximum = part.durationMinutes ?? part.durationRangeMinutes?.[1];
    if (minimum === undefined || maximum === undefined) throw new Error(`Catalog travel part has no duration: ${part.key}`);
    const arrival = part.recommendedArrivalMinutes ?? 0;
    minimumMinutes += minimum + arrival;
    maximumMinutes += maximum + arrival;
  }
  return { minimumMinutes, maximumMinutes };
}

function validateJourney(
  label: string,
  references: CatalogTravelPartReference[],
  expectedOrigin: string,
  expectedDestination: string,
  partByKey: Map<string, CatalogTravelPart>,
  errors: string[],
) {
  if (!references.length) {
    errors.push(`${label} has no stages`);
    return;
  }
  let previousDestination = expectedOrigin;
  for (const [index, reference] of references.entries()) {
    if (reference.reverse !== undefined && typeof reference.reverse !== "boolean") {
      errors.push(`${label}[${index}] has an invalid reverse flag`);
      continue;
    }
    const part = partByKey.get(reference.partKey);
    if (!part) {
      errors.push(`${label}[${index}] references unknown part ${reference.partKey}`);
      continue;
    }
    const endpoints = effectiveEndpoints(part, reference.reverse);
    if (endpoints.origin !== previousDestination) {
      errors.push(`${label}[${index}] leaves a gap from ${previousDestination} to ${endpoints.origin}`);
    }
    previousDestination = endpoints.destination;
  }
  if (previousDestination !== expectedDestination) {
    errors.push(`${label} ends at ${previousDestination}, expected ${expectedDestination}`);
  }
}

export function validateCatalogTravelData(
  partFile: CatalogTravelPartFile,
  planFile: CatalogTripPlanFile,
  destinationKeys: string[],
  countryCodeByDestination: ReadonlyMap<string, string> = new Map(),
) {
  const errors: string[] = [];
  if (partFile.schemaVersion !== 1) errors.push("travel parts schemaVersion must be 1");
  if (planFile.schemaVersion !== 1) errors.push("trip plans schemaVersion must be 1");

  const partByKey = new Map<string, CatalogTravelPart>();
  for (const [index, part] of partFile.parts.entries()) {
    const label = `parts[${index}]`;
    if (!isCatalogTravelKey(part.key) || partByKey.has(part.key)) errors.push(`${label} has a duplicate or invalid key`);
    partByKey.set(part.key, part);
    if (!partKinds.has(part.kind)) errors.push(`${label} has an invalid kind`);
    if (!confidenceLevels.has(part.confidence)) errors.push(`${label} has an invalid confidence`);
    if (!isCatalogTravelKey(part.origin.key) || !part.origin.name.trim() || !validCoordinates(part.origin.coordinates)) errors.push(`${label} has an invalid origin`);
    if (!isCatalogTravelKey(part.destination.key) || !part.destination.name.trim() || !validCoordinates(part.destination.coordinates)) errors.push(`${label} has an invalid destination`);
    if (part.origin.key === part.destination.key) errors.push(`${label} must connect two places`);
    const hasDuration = Number.isFinite(part.durationMinutes) && (part.durationMinutes ?? 0) > 0;
    const range = part.durationRangeMinutes;
    const hasRange = range !== undefined && Number.isFinite(range[0]) && Number.isFinite(range[1]) && range[0] > 0 && range[1] >= range[0];
    if (hasDuration === hasRange) errors.push(`${label} must have exactly one duration or duration range`);
    if (part.distanceKm !== undefined && (!Number.isFinite(part.distanceKm) || part.distanceKm <= 0)) errors.push(`${label} has invalid distance`);
    if (part.kind === "ferry") {
      if (part.recommendedArrivalMinutes !== 60) errors.push(`${label} ferry must include the 60-minute recommended arrival`);
      if (!part.operator?.trim() || !part.service?.trim() || !part.bookingUrl || !validUrl(part.bookingUrl)) errors.push(`${label} ferry metadata is incomplete`);
    } else if (part.recommendedArrivalMinutes !== undefined) {
      errors.push(`${label} car part cannot have a ferry arrival recommendation`);
    }
    if (!isCatalogTravelKey(part.source.key) || !sourceKinds.has(part.source.kind) || !validUrl(part.source.url) || !validIsoDate(part.source.retrievedAt) || !validIsoDate(part.source.refreshAfter)) errors.push(`${label} source is invalid`);
    if (part.source.endpointSnapMeters && (part.source.endpointSnapMeters.some((distance) => !Number.isFinite(distance) || distance < 0 || distance > 1_000))) errors.push(`${label} source snapped too far from a requested access node`);
  }

  const expectedDestinations = new Set(destinationKeys);
  const seenDestinations = new Set<string>();
  for (const [index, plan] of planFile.plans.entries()) {
    const label = `plans[${index}]`;
    if (!isCatalogTravelKey(plan.key)) errors.push(`${label} has an invalid key`);
    if (!expectedDestinations.has(plan.destinationKey) || seenDestinations.has(plan.destinationKey)) errors.push(`${label} has an unknown or duplicate destination`);
    seenDestinations.add(plan.destinationKey);
    if (plan.originKey !== "aalborg") errors.push(`${label} must use Aalborg as the MVP origin`);
    const modeKeys = Object.keys(plan.modes);
    if (modeKeys.length !== catalogTravelModes.length || catalogTravelModes.some((mode) => !(mode in plan.modes)) || modeKeys.some((mode) => !catalogTravelModes.includes(mode as CatalogTravelMode))) errors.push(`${label} does not explicitly cover every travel mode`);
    for (const mode of catalogTravelModes) {
      const modePlan = plan.modes[mode];
      if (!modePlan) {
        errors.push(`${label}.${mode} must define a mode plan`);
        continue;
      }
      if (modePlan.status === "details-unavailable") {
        if (typeof modePlan.reason !== "string" || !modePlan.reason.trim()) errors.push(`${label}.${mode} needs an unavailable reason`);
        continue;
      }
      if (modePlan.status !== "available") {
        errors.push(`${label}.${mode} has an invalid status`);
        continue;
      }
      if (!Array.isArray(modePlan.outbound) || !Array.isArray(modePlan.return)) {
        errors.push(`${label}.${mode} needs outbound and return stages`);
        continue;
      }
      validateJourney(`${label}.${mode}.outbound`, modePlan.outbound, plan.originKey, plan.destinationKey, partByKey, errors);
      validateJourney(`${label}.${mode}.return`, modePlan.return, plan.destinationKey, plan.originKey, partByKey, errors);
      if (mode === "car" && countryCodeByDestination.get(plan.destinationKey) === "NO") {
        const ferryCount = modePlan.outbound.filter((reference) => partByKey.get(reference.partKey)?.kind === "ferry").length;
        if (ferryCount !== 1) errors.push(`${label}.car must use exactly one optimal ferry outbound`);
      }
    }
  }
  for (const destinationKey of expectedDestinations) {
    if (!seenDestinations.has(destinationKey)) errors.push(`missing trip plan for ${destinationKey}`);
  }
  return errors;
}
