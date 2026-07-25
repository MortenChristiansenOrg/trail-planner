import type { JourneyDirection } from "@trail-planner/domain";
import {
  resolveCatalogCarJourney,
  type ResolvedCatalogTravelPart,
} from "@/features/catalog/catalogTravelData";
import { loadRoadRoute } from "@/features/maps/drivingRoute";

export type LoadedCatalogRoutePart = ResolvedCatalogTravelPart & {
  coordinates: [number, number][];
  durationMinutes: number;
  sourceUrl: string;
};

export async function loadCatalogRouteJourney(
  destinationId: string,
  direction: JourneyDirection,
  signal?: AbortSignal,
): Promise<LoadedCatalogRoutePart[]> {
  const parts = resolveCatalogCarJourney(destinationId, direction);
  return Promise.all(parts.map(async (resolved) => {
    if (resolved.part.kind === "ferry") {
      const durationMinutes = resolved.part.durationMinutes ?? resolved.part.durationRangeMinutes?.[1];
      if (durationMinutes === undefined) throw new Error(`Ferry duration is unavailable: ${resolved.part.key}`);
      return {
        ...resolved,
        coordinates: [resolved.origin.coordinates, resolved.destination.coordinates],
        durationMinutes,
        sourceUrl: resolved.part.source.url,
      };
    }
    const route = await loadRoadRoute([resolved.origin.coordinates, resolved.destination.coordinates], signal);
    return {
      ...resolved,
      coordinates: route.coordinates,
      durationMinutes: route.durationMinutes,
      sourceUrl: route.sourceUrl,
    };
  }));
}
