import type { Money } from "./budget";
import { isCatalogTravelKey } from "./catalogTravel";
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

export type TravelLegKind = "walk" | "car" | "rail" | "bus" | "flight" | "ferry" | "shuttle" | "transfer";
export type JourneyDirection = "outbound" | "return";

export type TravelPlace = {
  name: string;
  coordinates?: [longitude: number, latitude: number];
};

export type TravelCostComponent = {
  id: string;
  label: string;
  amount: Money;
  source: string;
};

export type TravelStage = {
  id: string;
  catalogPartKey?: string;
  kind: TravelLegKind;
  origin: TravelPlace;
  destination: TravelPlace;
  durationMinutes: number;
  departureTime?: string;
  arrivalTime?: string;
  operator?: string;
  service?: string;
  geometry?: [longitude: number, latitude: number][];
  bookingUrl?: string;
  sourceUrl?: string;
  confidence: "low" | "medium" | "high";
  costComponentIds: string[];
  technicalStops?: string[];
  transferType?: "layover" | "wait" | "check-in" | "connection";
};

export type TravelJourney = {
  direction: JourneyDirection;
  stages: TravelStage[];
};

export type TravelOptionSnapshot = {
  id: string;
  label: string;
  priceType: "live" | "sampled" | "estimated";
  pricingBasis: "per-person" | "per-group";
  outbound: TravelJourney;
  return: TravelJourney;
  costComponents: TravelCostComponent[];
  providerTotals?: { durationMinutes?: number; cost?: Money };
  warnings: string[];
  assumptions: string[];
  retrievedAt: string;
  source: { provider: string; url?: string };
};

const travelLegKinds = new Set<TravelLegKind>(["walk", "car", "rail", "bus", "flight", "ferry", "shuttle", "transfer"]);
const transferTypes = new Set<NonNullable<TravelStage["transferType"]>>(["layover", "wait", "check-in", "connection"]);
const confidenceLevels = new Set<TravelStage["confidence"]>(["low", "medium", "high"]);
const priceTypes = new Set<TravelOptionSnapshot["priceType"]>(["live", "sampled", "estimated"]);
const pricingBases = new Set<TravelOptionSnapshot["pricingBasis"]>(["per-person", "per-group"]);
const supportedCurrencies = new Set<Money["currency"]>(["DKK", "EUR", "NOK", "SEK", "GBP"]);
const plannedTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/;
const retrievedAtPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

function requireDuration(value: number) {
  if (!Number.isFinite(value) || value < 0) throw new Error("Stage duration must be a non-negative finite number");
}

function requireCoordinates(coordinates: [number, number], label: string) {
  const [longitude, latitude] = coordinates;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error(`${label} coordinates are invalid`);
  }
}

function requireHttpsUrl(value: string, label: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} URL is invalid`);
  }
  if (parsed.protocol !== "https:") throw new Error(`${label} URL must use HTTPS`);
}

function hasValidCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

export function deriveTravelOptionTotals(option: TravelOptionSnapshot) {
  if (!option.id.trim() || !option.label.trim() || !priceTypes.has(option.priceType) || !pricingBases.has(option.pricingBasis)) {
    throw new Error("Travel option identity or pricing metadata is invalid");
  }
  if (!Array.isArray(option.warnings) || option.warnings.some((warning) => typeof warning !== "string" || !warning.trim()) || !Array.isArray(option.assumptions) || option.assumptions.some((assumption) => typeof assumption !== "string" || !assumption.trim())) {
    throw new Error("Travel option warnings or assumptions are invalid");
  }
  if (!option.source.provider.trim()) throw new Error("Travel option provider is required");
  if (option.source.url) requireHttpsUrl(option.source.url, "Travel option source");
  if (option.outbound.direction !== "outbound" || option.return.direction !== "return") {
    throw new Error("Travel journey direction does not match its position");
  }
  if (!option.outbound.stages.length || !option.return.stages.length) throw new Error("Travel options require outbound and return stages");
  const stages = [...option.outbound.stages, ...option.return.stages];
  const stageIds = new Set<string>();
  for (const stage of stages) {
    if (!stage.id.trim() || stageIds.has(stage.id)) throw new Error(`Duplicate or empty travel stage id: ${stage.id}`);
    stageIds.add(stage.id);
    if (stage.catalogPartKey !== undefined && !isCatalogTravelKey(stage.catalogPartKey)) throw new Error(`Travel stage catalog part key is invalid: ${stage.id}`);
    if (!travelLegKinds.has(stage.kind) || !confidenceLevels.has(stage.confidence)) throw new Error(`Travel stage classification is invalid: ${stage.id}`);
    if (stage.kind === "transfer" && !stage.transferType) throw new Error(`Travel transfer type is required: ${stage.id}`);
    if (stage.transferType && !transferTypes.has(stage.transferType)) throw new Error(`Travel transfer type is invalid: ${stage.id}`);
    if (stage.kind !== "transfer" && stage.transferType) throw new Error(`Only transfer stages can have a transfer type: ${stage.id}`);
    requireDuration(stage.durationMinutes);
    if (!stage.origin.name.trim() || !stage.destination.name.trim()) throw new Error("Travel stages require named places");
    if (stage.origin.coordinates) requireCoordinates(stage.origin.coordinates, stage.origin.name);
    if (stage.destination.coordinates) requireCoordinates(stage.destination.coordinates, stage.destination.name);
    if (stage.geometry && stage.geometry.length < 2) throw new Error(`Travel stage geometry is incomplete: ${stage.id}`);
    stage.geometry?.forEach((coordinates) => requireCoordinates(coordinates, stage.id));
    if (Boolean(stage.departureTime) !== Boolean(stage.arrivalTime)) throw new Error("Travel stage times must be provided together");
    if (stage.departureTime && stage.arrivalTime) {
      if (!plannedTimePattern.test(stage.departureTime) || !plannedTimePattern.test(stage.arrivalTime) || !hasValidCalendarDate(stage.departureTime) || !hasValidCalendarDate(stage.arrivalTime)) throw new Error("Travel stage times are invalid");
      const departure = Date.parse(stage.departureTime);
      const arrival = Date.parse(stage.arrivalTime);
      const departureHasOffset = /(Z|[+-]\d{2}:\d{2})$/.test(stage.departureTime);
      const arrivalHasOffset = /(Z|[+-]\d{2}:\d{2})$/.test(stage.arrivalTime);
      const comparable = (departureHasOffset && arrivalHasOffset) || stage.origin.name === stage.destination.name;
      if (!Number.isFinite(departure) || !Number.isFinite(arrival) || (comparable && arrival < departure)) throw new Error("Travel stage times are invalid");
    }
    if (new Set(stage.costComponentIds).size !== stage.costComponentIds.length) throw new Error(`Duplicate cost reference on stage: ${stage.id}`);
    if (stage.bookingUrl) requireHttpsUrl(stage.bookingUrl, `${stage.id} booking`);
    if (stage.sourceUrl) requireHttpsUrl(stage.sourceUrl, `${stage.id} source`);
    if (stage.technicalStops?.some((stop) => !stop.trim())) throw new Error(`Travel stage technical stop is invalid: ${stage.id}`);
  }
  if (!option.costComponents.length) throw new Error("Travel options require at least one explicit cost component");
  const costById = new Map(option.costComponents.map((component) => [component.id, component]));
  if (costById.size !== option.costComponents.length) throw new Error("Duplicate travel cost component id");
  for (const component of option.costComponents) {
    if (!component.id.trim() || !component.label.trim() || !component.source.trim()) throw new Error("Travel cost component metadata is incomplete");
    if (!supportedCurrencies.has(component.amount.currency)) throw new Error("Travel cost currency is unsupported");
  }
  for (const stage of stages) {
    for (const id of stage.costComponentIds) {
      if (!costById.has(id)) throw new Error(`Missing travel cost component: ${id}`);
    }
  }
  const referencedCostIds = new Set(stages.flatMap((stage) => stage.costComponentIds));
  if (option.costComponents.some((component) => !referencedCostIds.has(component.id))) throw new Error("Travel cost component is not referenced by a stage");
  const currencies = new Set(option.costComponents.map((component) => component.amount.currency));
  if (currencies.size > 1) throw new Error("Travel costs must use one currency");
  const cost = option.costComponents.reduce((sum, component) => {
    if (!Number.isFinite(component.amount.amount) || component.amount.amount < 0) throw new Error("Travel cost must be a non-negative finite number");
    return sum + component.amount.amount;
  }, 0);
  if (option.providerTotals?.durationMinutes !== undefined) requireDuration(option.providerTotals.durationMinutes);
  if (option.providerTotals?.cost) {
    if (!Number.isFinite(option.providerTotals.cost.amount) || option.providerTotals.cost.amount < 0) throw new Error("Provider travel cost must be a non-negative finite number");
    if (!supportedCurrencies.has(option.providerTotals.cost.currency)) throw new Error("Provider travel cost currency is unsupported");
    const derivedCurrency = option.costComponents[0]?.amount.currency;
    if (option.providerTotals.cost.currency !== derivedCurrency) throw new Error("Provider and derived travel costs must use one currency");
  }
  if (!retrievedAtPattern.test(option.retrievedAt) || !hasValidCalendarDate(option.retrievedAt) || !Number.isFinite(Date.parse(option.retrievedAt))) throw new Error("Travel option retrieval time is invalid");
  const countLayovers = (journey: TravelJourney) => journey.stages.filter((stage) => stage.kind === "transfer" && stage.transferType === "layover").length;
  return {
    durationMinutes: stages.reduce((sum, stage) => sum + stage.durationMinutes, 0),
    cost: { amount: Math.round((cost + Number.EPSILON) * 100) / 100, currency: option.costComponents[0]?.amount.currency ?? "DKK" } as Money,
    layovers: countLayovers(option.outbound),
    returnLayovers: countLayovers(option.return),
  };
}

export type AmadeusSegment = {
  id: string;
  departure: { iataCode: string; at: string; coordinates?: [number, number] };
  arrival: { iataCode: string; at: string; coordinates?: [number, number] };
  carrierCode: string;
  number: string;
  duration: string;
  numberOfStops?: number;
};

export type AmadeusOffer = {
  id: string;
  itineraries: Array<{ duration: string; segments: AmadeusSegment[] }>;
  price: { grandTotal: string; currency: string };
};

function isoDurationMinutes(value: string) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(value);
  if (!match || (match[1] === undefined && match[2] === undefined)) throw new Error(`Unsupported ISO duration: ${value}`);
  return Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
}

function currencyCode(value: string): Money["currency"] {
  if (value === "DKK" || value === "EUR" || value === "NOK" || value === "SEK" || value === "GBP") return value;
  throw new Error(`Unsupported travel currency: ${value}`);
}

export function mapAmadeusOffer(offer: AmadeusOffer, retrievedAt: string): TravelOptionSnapshot {
  if (!offer.id.trim()) throw new Error("Amadeus offer id is required");
  if (offer.itineraries.length !== 2) throw new Error("A return flight offer must contain outbound and return itineraries");
  const costId = `amadeus-${offer.id}-fare`;
  const currency = currencyCode(offer.price.currency);
  if (!/^\d+(?:\.\d+)?$/.test(offer.price.grandTotal)) throw new Error("Amadeus offer price is invalid");
  const price = Number(offer.price.grandTotal);
  const journey = (direction: JourneyDirection, itinerary: AmadeusOffer["itineraries"][number]): TravelJourney => {
    const stages: TravelStage[] = [];
    itinerary.segments.forEach((segment, index) => {
      if (index) {
        const previous = itinerary.segments[index - 1];
        if (previous.arrival.iataCode !== segment.departure.iataCode) {
          throw new Error("Connecting flight segments must meet at one airport");
        }
        const waitMinutes = Math.round((Date.parse(segment.departure.at) - Date.parse(previous.arrival.at)) / 60_000);
        if (!Number.isFinite(waitMinutes) || waitMinutes < 0) throw new Error("Flight segments have invalid connection times");
        stages.push({
          id: `${direction}-layover-${index}`,
          kind: "transfer",
          origin: { name: previous.arrival.iataCode, coordinates: previous.arrival.coordinates },
          destination: { name: previous.arrival.iataCode, coordinates: previous.arrival.coordinates },
          durationMinutes: waitMinutes,
          departureTime: previous.arrival.at,
          arrivalTime: segment.departure.at,
          confidence: "high",
          costComponentIds: [],
          transferType: "layover",
        });
      }
      if (segment.numberOfStops !== undefined && (!Number.isInteger(segment.numberOfStops) || segment.numberOfStops < 0)) {
        throw new Error("Flight technical-stop count is invalid");
      }
      stages.push({
        id: `${direction}-flight-${segment.id}`,
        kind: "flight",
        origin: { name: segment.departure.iataCode, coordinates: segment.departure.coordinates },
        destination: { name: segment.arrival.iataCode, coordinates: segment.arrival.coordinates },
        durationMinutes: isoDurationMinutes(segment.duration),
        departureTime: segment.departure.at,
        arrivalTime: segment.arrival.at,
        operator: segment.carrierCode,
        service: `${segment.carrierCode}${segment.number}`,
        confidence: "high",
        costComponentIds: [costId],
        technicalStops: segment.numberOfStops ? [`${segment.numberOfStops} provider-reported technical stop${segment.numberOfStops === 1 ? "" : "s"}`] : [],
      });
    });
    return { direction, stages };
  };

  const option: TravelOptionSnapshot = {
    id: `amadeus-${offer.id}`,
    label: "Return flight offer",
    priceType: "live",
    pricingBasis: "per-group",
    outbound: journey("outbound", offer.itineraries[0]),
    return: journey("return", offer.itineraries[1]),
    costComponents: [{ id: costId, label: "Return airfare", amount: { amount: price, currency }, source: "Amadeus offer total" }],
    providerTotals: {
      durationMinutes: offer.itineraries.reduce((sum, itinerary) => sum + isoDurationMinutes(itinerary.duration), 0),
      cost: { amount: price, currency },
    },
    warnings: [],
    assumptions: [],
    retrievedAt,
    source: { provider: "Amadeus", url: "https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/flights/" },
  };
  deriveTravelOptionTotals(option);
  return option;
}
