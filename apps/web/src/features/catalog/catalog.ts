import type {
  CatalogDestinationDetail,
  CatalogDestinationDigest,
  CatalogHeroMedia,
  CatalogHike,
  CatalogLodging,
  CatalogProvenanceSummary,
  CatalogTravelEstimate,
  HikeDifficulty,
  HikeRouteType,
} from "@trail-planner/domain";
import {
  catalogDigest,
  catalogVersion,
} from "@/generated/catalogDigest";
import type {
  CarCostEstimate,
  HomeCity,
  VehicleProfile,
} from "@trail-planner/domain";

export type TravelMode = "car" | "train" | "plane";

export type TravelEstimate = CatalogTravelEstimate & {
  pricingBasis?: "per-person" | "per-group";
  origin?: HomeCity;
  vehicle?: VehicleProfile;
  distanceKm?: number;
  costBreakdown?: CarCostEstimate;
  destinationId?: string;
};

export type CatalogProvenance = {
  sourceUrl: string;
  verifiedAt: string;
  confidence: "high" | "medium" | "low";
};

export type CatalogMedia = CatalogHeroMedia;

export type Hike = {
  id: string;
  name: string;
  routeType: HikeRouteType;
  durationHours: number;
  durationDays: number;
  distanceKm?: number;
  ascentM?: number;
  descentM?: number;
  difficulty: HikeDifficulty;
  description: string;
  trailhead: string;
  accessCaveat?: string;
  route: [number, number][];
  geometrySourceUrl?: string;
  provenance: CatalogProvenance;
};

export type KnownLodging = CatalogLodging;

export type Destination = {
  id: string;
  aliases: string[];
  name: string;
  region: string;
  country: string;
  countryCode: string;
  coordinates: [number, number];
  recommendedMonths: number[];
  summary: string;
  character: string;
  travel: TravelEstimate[];
  hikes: Hike[];
  lodgings: KnownLodging[];
  provenance: CatalogProvenance;
  media: CatalogMedia;
  hikeCount: number;
  catalogVersion: string;
  guide?: CatalogDestinationDetail["guide"];
  detailProvenance?: CatalogProvenanceSummary[];
};

function hikeFromCatalog(hike: CatalogHike): Hike {
  return {
    id: hike.key,
    name: hike.name,
    routeType: hike.routeType,
    durationHours: hike.durationHours,
    durationDays: hike.durationDays,
    distanceKm: hike.distanceKm,
    ascentM: hike.ascentM,
    descentM: hike.descentM,
    difficulty: hike.difficulty,
    description: hike.description,
    trailhead: hike.trailhead,
    accessCaveat: hike.accessCaveat,
    route: hike.geometry?.coordinates ?? [],
    geometrySourceUrl: hike.geometry?.sourceUrl,
    provenance: {
      sourceUrl: hike.provenance.sourceUrl,
      verifiedAt: hike.provenance.verifiedAt,
      confidence: hike.provenance.confidence,
    },
  };
}

export function destinationFromDigest(digest: CatalogDestinationDigest): Destination {
  return {
    id: digest.destinationKey,
    aliases: digest.aliases,
    name: digest.name,
    region: digest.region,
    country: digest.country,
    countryCode: digest.countryCode,
    coordinates: digest.coordinates,
    recommendedMonths: digest.recommendedMonths,
    summary: digest.summary,
    character: digest.character,
    travel: digest.travel,
    hikes: [],
    lodgings: digest.lodgings,
    provenance: {
      sourceUrl: digest.provenance.sourceUrl,
      verifiedAt: digest.provenance.verifiedAt,
      confidence: digest.provenance.confidence,
    },
    media: digest.hero,
    hikeCount: digest.hikeCount,
    catalogVersion: digest.catalogVersion,
  };
}

export function destinationWithDetail(
  destination: Destination,
  detail: CatalogDestinationDetail,
): Destination {
  if (destination.id !== detail.destinationKey || destination.catalogVersion !== detail.catalogVersion) {
    throw new Error(`Catalog detail version mismatch for ${destination.id}`);
  }
  return {
    ...destination,
    guide: detail.guide,
    media: detail.hero,
    hikes: detail.hikes.map(hikeFromCatalog),
    detailProvenance: detail.provenance,
  };
}

export async function loadStaticCatalogDetail(destinationKey: string) {
  const { catalogDetails } = await import("@/generated/catalogDetails");
  return catalogDetails[destinationKey] ?? null;
}

export const destinations: Destination[] = catalogDigest.map(destinationFromDigest);
export const destinationById = new Map(destinations.map((item) => [item.id, item]));
export const staticCatalogVersion = catalogVersion;

export const countryOptions = Array.from(
  new Map(destinations.map((item) => [item.countryCode, item.country])).entries(),
).map(([code, name]) => ({ code, name }));

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatHours(value: number) {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
