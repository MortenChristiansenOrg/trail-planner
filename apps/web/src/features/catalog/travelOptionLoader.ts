import { deriveTravelOptionTotals, type JourneyDirection, type TravelOptionSnapshot, type TravelStage } from "@trail-planner/domain";
import { destinations } from "@/features/catalog/catalog";
import {
  getCatalogCarOptionId,
  getCatalogCarPlan,
  getCatalogFerryPart,
  getExploreDestinationIdForOption,
  resolveCatalogCarJourney,
} from "@/features/catalog/catalogTravelData";
import { drivingRoutePoints, loadRoadRoute } from "@/features/maps/drivingRoute";
import { loadCatalogRouteJourney, type LoadedCatalogRoutePart } from "@/features/maps/catalogRoute";
import { createDrivingOption } from "@/features/catalog/travelOptions";

export async function loadTravelOption(optionId: string): Promise<TravelOptionSnapshot | undefined> {
  const destinationId = getExploreDestinationIdForOption(optionId);
  if (destinationId) return loadCatalogDrivingOption(destinationId, optionId);
  const destination = destinations.find(({ travel }) => travel.some((estimate) => estimate.mode === "car" && estimate.optionId === optionId));
  const carEstimate = destination?.travel.find((estimate) => estimate.mode === "car" && estimate.optionId === optionId);
  if (!destination || !carEstimate?.available) return undefined;
  const viaSouthernDenmark = destination.countryCode !== "NO";
  const points = drivingRoutePoints(destination.coordinates, viaSouthernDenmark);
  const [outbound, inbound] = await Promise.all([
    loadRoadRoute(points).catch(() => undefined),
    loadRoadRoute([...points].reverse()).catch(() => undefined),
  ]);
  const option = createDrivingOption({
    destinationId: destination.id,
    destinationName: destination.name,
    destinationCoordinates: destination.coordinates,
    oneWayHours: carEstimate.oneWayHours,
    costPerPersonDkk: carEstimate.costPerPersonDkk,
    viaSouthernDenmark,
  }, outbound, inbound);
  deriveTravelOptionTotals(option);
  return option;
}

async function loadCatalogDrivingOption(destinationId: string, optionId: string) {
  const destination = destinations.find(({ id }) => id === destinationId);
  const carEstimate = destination?.travel.find(({ mode }) => mode === "car");
  const carPlan = getCatalogCarPlan(destinationId);
  const ferry = getCatalogFerryPart(destinationId);
  if (!destination || !carEstimate?.available || !carPlan || !ferry || getCatalogCarOptionId(destinationId) !== optionId) return undefined;
  const [outboundJourney, inboundJourney] = await Promise.all([
    loadCatalogJourneyForDetails(destinationId, "outbound"),
    loadCatalogJourneyForDetails(destinationId, "return"),
  ]);
  const fallbackDirectionCount = Number(outboundJourney.usedFallback) + Number(inboundJourney.usedFallback);
  const costId = `${destinationId}-car-ferry-estimate`;
  const option: TravelOptionSnapshot = {
    id: optionId,
    label: `Drive and ferry from Aalborg to ${destination.name}`,
    priceType: "estimated",
    pricingBasis: "per-person",
    outbound: { direction: "outbound", stages: createCatalogStages(outboundJourney.parts, "outbound", costId) },
    return: { direction: "return", stages: createCatalogStages(inboundJourney.parts, "return", costId) },
    costComponents: [{
      id: costId,
      label: "Estimated return car and ferry cost",
      amount: { amount: carEstimate.costPerPersonDkk, currency: "DKK" },
      source: "Saved Explore catalog estimate",
    }],
    warnings: [
      `${ferry.availability ?? "Verify the sailing for the selected date."} Ferry fares and vehicle space are not live.`,
      fallbackDirectionCount === 0
        ? "Road geometry and drive time come from OSRM; traffic and rest stops are not included."
        : fallbackDirectionCount === 1
          ? "Live road geometry could not be refreshed for one direction, so saved catalog durations are shown for those driving legs."
          : "Live road geometry could not be refreshed, so saved catalog durations are shown for the driving legs.",
    ],
    assumptions: [
      carPlan.selectionNote ?? "The catalog-selected ferry is used for both directions.",
      "Each ferry direction includes the operator-recommended 60-minute terminal arrival as its own stage.",
    ],
    retrievedAt: new Date().toISOString(),
    source: { provider: `${ferry.operator ?? "Ferry operator"} + OSRM`, url: ferry.source.url },
  };
  deriveTravelOptionTotals(option);
  return option;
}

type CatalogDetailPart = Omit<LoadedCatalogRoutePart, "coordinates"> & {
  coordinates?: [number, number][];
};

async function loadCatalogJourneyForDetails(destinationId: string, direction: JourneyDirection) {
  try {
    return { parts: await loadCatalogRouteJourney(destinationId, direction) as CatalogDetailPart[], usedFallback: false };
  } catch {
    const parts = resolveCatalogCarJourney(destinationId, direction).map((resolved): CatalogDetailPart => {
      const durationMinutes = resolved.part.durationMinutes ?? resolved.part.durationRangeMinutes?.[1];
      if (durationMinutes === undefined) throw new Error(`Catalog duration is unavailable: ${resolved.part.key}`);
      return {
        ...resolved,
        durationMinutes,
        sourceUrl: resolved.part.source.url,
      };
    });
    return { parts, usedFallback: true };
  }
}

function createCatalogStages(parts: CatalogDetailPart[], direction: JourneyDirection, costId: string): TravelStage[] {
  return parts.flatMap(({ part, origin, destination, durationMinutes, coordinates, sourceUrl }, index) => {
    const stageId = `${direction}-${index}-${part.key}`;
    const transportStage: TravelStage = {
      id: stageId,
      catalogPartKey: part.key,
      kind: part.kind,
      origin,
      destination,
      durationMinutes,
      operator: part.operator,
      service: part.service,
      geometry: coordinates,
      bookingUrl: part.bookingUrl,
      sourceUrl,
      confidence: part.confidence,
      costComponentIds: [costId],
    };
    if (part.kind !== "ferry" || !part.recommendedArrivalMinutes) return [transportStage];
    const arrivalStage: TravelStage = {
      id: `${stageId}-arrival-buffer`,
      kind: "transfer",
      transferType: "check-in",
      origin,
      destination: origin,
      durationMinutes: part.recommendedArrivalMinutes,
      operator: part.operator,
      service: "Recommended ferry terminal arrival",
      confidence: part.confidence,
      costComponentIds: [],
    };
    return [arrivalStage, transportStage];
  });
}
