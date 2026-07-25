import { deriveTravelOptionTotals, type JourneyDirection, type TravelOptionSnapshot, type TravelStage } from "@trail-planner/domain";
import { destinations, type TravelEstimate } from "@/features/catalog/catalog";
import {
  getCatalogCarOptionId,
  getCatalogCarPlan,
  getCatalogFerryPart,
  getExploreDestinationIdForOption,
  resolveCatalogCarJourney,
} from "@/features/catalog/catalogTravelData";
import { drivingRoutePoints, loadRoadRoute } from "@/features/maps/drivingRoute";
import { loadCatalogRouteJourney, type LoadedCatalogRoutePart } from "@/features/maps/catalogRoute";
import {
  createDrivingOption,
  createEstimatedTravelOption,
  drivingCostComponents,
} from "@/features/catalog/travelOptions";

export async function loadTravelOption(
  optionId: string,
  personalizedEstimate?: TravelEstimate,
): Promise<TravelOptionSnapshot | undefined> {
  if (
    personalizedEstimate?.destinationId &&
    personalizedEstimate.optionId === optionId
  ) {
    return loadPersonalizedTravelOption(optionId, personalizedEstimate);
  }
  const destinationId = getExploreDestinationIdForOption(optionId);
  if (destinationId) return loadCatalogDrivingOption(destinationId, optionId);
  const destination = destinations.find(({ travel }) => travel.some((estimate) => estimate.optionId === optionId));
  const estimate = destination?.travel.find((candidate) => candidate.optionId === optionId);
  if (!destination || !estimate?.available) return undefined;
  if (estimate.mode !== "car") {
    const option = createEstimatedTravelOption({
      destinationId: destination.id,
      destinationName: destination.name,
      destinationCoordinates: destination.coordinates,
      mode: estimate.mode,
      oneWayHours: estimate.oneWayHours,
      costPerPersonDkk: estimate.costPerPersonDkk,
      layovers: estimate.layovers,
      confidence: estimate.confidence,
    });
    deriveTravelOptionTotals(option);
    return option;
  }
  const carEstimate = estimate;
  const viaSouthernDenmark = destination.countryCode !== "NO";
  const points = drivingRoutePoints(
    [9.922, 57.048],
    destination.coordinates,
    viaSouthernDenmark,
  );
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

async function loadPersonalizedTravelOption(
  optionId: string,
  estimate: TravelEstimate,
) {
  const destination = destinations.find(
    ({ id }) => id === estimate.destinationId,
  );
  if (!destination || !estimate.available || !estimate.origin) return undefined;
  if (estimate.mode !== "car") {
    const option = createEstimatedTravelOption({
      optionId,
      destinationId: destination.id,
      destinationName: destination.name,
      destinationCoordinates: destination.coordinates,
      mode: estimate.mode,
      oneWayHours: estimate.oneWayHours,
      costPerPersonDkk: estimate.costPerPersonDkk,
      layovers: estimate.layovers,
      confidence: estimate.confidence,
      origin: estimate.origin,
    });
    deriveTravelOptionTotals(option);
    return option;
  }

  if (estimate.origin.name === "Aalborg" && getCatalogCarPlan(destination.id)) {
    return loadCatalogDrivingOption(destination.id, optionId, estimate);
  }
  const points = drivingRoutePoints(
    estimate.origin.coordinates,
    destination.coordinates,
    destination.countryCode !== "NO",
  );
  const [outbound, inbound] = await Promise.all([
    loadRoadRoute(points).catch(() => undefined),
    loadRoadRoute([...points].reverse()).catch(() => undefined),
  ]);
  const option = createDrivingOption(
    {
      optionId,
      destinationId: destination.id,
      destinationName: destination.name,
      destinationCoordinates: destination.coordinates,
      oneWayHours: estimate.oneWayHours,
      costPerPersonDkk: estimate.costPerPersonDkk,
      viaSouthernDenmark: destination.countryCode !== "NO",
      origin: estimate.origin,
      costBreakdown: estimate.costBreakdown,
    },
    outbound,
    inbound,
  );
  deriveTravelOptionTotals(option);
  return option;
}

async function loadCatalogDrivingOption(
  destinationId: string,
  optionId: string,
  personalizedEstimate?: TravelEstimate,
) {
  const destination = destinations.find(({ id }) => id === destinationId);
  const carEstimate = destination?.travel.find(({ mode }) => mode === "car");
  const carPlan = getCatalogCarPlan(destinationId);
  const ferry = getCatalogFerryPart(destinationId);
  if (
    !destination ||
    !carEstimate?.available ||
    !carPlan ||
    !ferry ||
    (!personalizedEstimate && getCatalogCarOptionId(destinationId) !== optionId)
  ) return undefined;
  const [outboundJourney, inboundJourney] = await Promise.all([
    loadCatalogJourneyForDetails(destinationId, "outbound"),
    loadCatalogJourneyForDetails(destinationId, "return"),
  ]);
  const fallbackDirectionCount = Number(outboundJourney.usedFallback) + Number(inboundJourney.usedFallback);
  const roadSourceProvider = fallbackDirectionCount === 0
    ? "OSRM"
    : fallbackDirectionCount === 1
      ? "OSRM + saved Explore catalog estimate"
      : "saved Explore catalog estimate";
  const costComponents = drivingCostComponents({
    destinationId,
    costPerPersonDkk:
      personalizedEstimate?.costPerPersonDkk ??
      carEstimate.costPerPersonDkk,
    costBreakdown: personalizedEstimate?.costBreakdown,
  });
  const costIds = costComponents.map(({ id }) => id);
  const originName = personalizedEstimate?.origin?.name ?? "Aalborg";
  const option: TravelOptionSnapshot = {
    id: optionId,
    label: `Drive and ferry from ${originName} to ${destination.name}`,
    priceType: "estimated",
    pricingBasis: personalizedEstimate?.costBreakdown
      ? "per-group"
      : "per-person",
    outbound: { direction: "outbound", stages: createCatalogStages(outboundJourney.parts, "outbound", costIds) },
    return: { direction: "return", stages: createCatalogStages(inboundJourney.parts, "return", costIds) },
    costComponents,
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
      `Each ferry direction includes the operator-recommended ${ferry.recommendedArrivalMinutes}-minute terminal arrival as its own stage.`,
      ...(personalizedEstimate?.costBreakdown?.assumptions ?? []),
    ],
    retrievedAt: new Date().toISOString(),
    source: { provider: `${ferry.operator ?? "Ferry operator"} + ${roadSourceProvider}`, url: ferry.source.url },
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

function createCatalogStages(
  parts: CatalogDetailPart[],
  direction: JourneyDirection,
  costIds: string[],
): TravelStage[] {
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
      costComponentIds: costIds,
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
