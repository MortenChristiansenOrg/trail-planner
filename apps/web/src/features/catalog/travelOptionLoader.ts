import { deriveTravelOptionTotals, type JourneyDirection, type TravelOptionSnapshot, type TravelStage } from "@trail-planner/domain";
import { destinations } from "@/features/catalog/catalog";
import {
  getCatalogCarOptionId,
  getCatalogCarPlan,
  getCatalogFerryPart,
  getExploreDestinationIdForOption,
} from "@/features/catalog/catalogTravelData";
import { drivingRoutePoints, loadRoadRoute } from "@/features/maps/drivingRoute";
import { loadCatalogRouteJourney, type LoadedCatalogRoutePart } from "@/features/maps/catalogRoute";
import { createInnsbruckDrivingOption, innsbruckCoordinates, innsbruckDrivingOptionId } from "@/features/catalog/travelOptions";

export async function loadTravelOption(optionId: string): Promise<TravelOptionSnapshot | undefined> {
  const destinationId = getExploreDestinationIdForOption(optionId);
  if (destinationId) return loadCatalogDrivingOption(destinationId, optionId);
  if (optionId !== innsbruckDrivingOptionId) return undefined;
  const points = drivingRoutePoints(innsbruckCoordinates, true);
  const [outbound, inbound] = await Promise.all([loadRoadRoute(points), loadRoadRoute([...points].reverse())]);
  const option = createInnsbruckDrivingOption(outbound, inbound);
  deriveTravelOptionTotals(option);
  return option;
}

async function loadCatalogDrivingOption(destinationId: string, optionId: string) {
  const destination = destinations.find(({ id }) => id === destinationId);
  const carEstimate = destination?.travel.find(({ mode }) => mode === "car");
  const carPlan = getCatalogCarPlan(destinationId);
  const ferry = getCatalogFerryPart(destinationId);
  if (!destination || !carEstimate?.available || !carPlan || !ferry || getCatalogCarOptionId(destinationId) !== optionId) return undefined;
  const [outbound, inbound] = await Promise.all([
    loadCatalogRouteJourney(destinationId, "outbound"),
    loadCatalogRouteJourney(destinationId, "return"),
  ]);
  const costId = `${destinationId}-car-ferry-estimate`;
  const option: TravelOptionSnapshot = {
    id: optionId,
    label: `Drive and ferry from Aalborg to ${destination.name}`,
    priceType: "estimated",
    pricingBasis: "per-person",
    outbound: { direction: "outbound", stages: createCatalogStages(outbound, "outbound", costId) },
    return: { direction: "return", stages: createCatalogStages(inbound, "return", costId) },
    costComponents: [{
      id: costId,
      label: "Estimated return car and ferry cost",
      amount: { amount: carEstimate.costPerPersonDkk, currency: "DKK" },
      source: "Saved Explore catalog estimate",
    }],
    warnings: [
      `${ferry.availability ?? "Verify the sailing for the selected date."} Ferry fares and vehicle space are not live.`,
      "Road geometry and drive time come from OSRM; traffic and rest stops are not included.",
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

function createCatalogStages(parts: LoadedCatalogRoutePart[], direction: JourneyDirection, costId: string): TravelStage[] {
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
